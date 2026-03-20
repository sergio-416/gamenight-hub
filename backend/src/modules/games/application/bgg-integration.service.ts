import { CacheService } from "@common/cache/cache.service.js";
import { ERROR_CODE } from "@common/error-codes";
import { HttpService } from "@nestjs/axios";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { AxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { parseStringPromise } from "xml2js";

type BggSearchResponse = {
  items?: {
    item?: BggItem | BggItem[];
  };
};

type BggItem = {
  $: { id: string };
  name?:
    | Array<{ $: { value: string; type?: string } }>
    | { $: { value: string; type?: string } };
  yearpublished?: { $: { value: string } };
};

type BggDetailResponse = {
  items?: {
    item?: {
      $: { id: string; type: string };
      name?: BggItem["name"];
      thumbnail?: string;
      image?: string;
      yearpublished?: { $: { value: string } };
      minplayers?: { $: { value: string } };
      maxplayers?: { $: { value: string } };
      playingtime?: { $: { value: string } };
      minage?: { $: { value: string } };
      description?: string;
      link?:
        | { $: { type: string; id: string; value: string } }
        | Array<{ $: { type: string; id: string; value: string } }>;
    };
  };
};

type SearchResult = {
  bggId: number;
  name: string;
  yearPublished?: number;
  isExpansion?: boolean;
};

type BggGameDetails = {
  bggId: number;
  name: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minAge?: number;
  description?: string;
  categories: string[];
  mechanics: string[];
  publisher?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  isExpansion: boolean;
};

@Injectable()
export class BggIntegrationService {
  readonly #logger = new Logger(BggIntegrationService.name);
  #lastRequestTime = 0;
  readonly #rateLimitDelay = 5000;

  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(CacheService) private readonly cacheService: CacheService
  ) {}

  async #enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.#lastRequestTime;

    if (timeSinceLastRequest < this.#rateLimitDelay) {
      const waitTime = this.#rateLimitDelay - timeSinceLastRequest;
      this.#logger.debug(
        `Rate limiting: waiting ${waitTime}ms before next BGG request`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.#lastRequestTime = Date.now();
  }

  #normaliseImageUrl(raw?: string): string | undefined {
    if (!raw || typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  }

  #extractName(name: BggItem["name"]): string {
    if (!name) return "Unknown Game";
    if (!Array.isArray(name)) {
      return name.$?.value ?? "Unknown Game";
    }
    const primary = name.find((n) => n.$.type === "primary");
    return (primary ?? name[0])?.$?.value ?? "Unknown Game";
  }

  async searchGames(query: string): Promise<SearchResult[]> {
    await this.#enforceRateLimit();
    const searchUrl = new URL("https://boardgamegeek.com/xmlapi2/search");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("type", "boardgame,boardgameexpansion");
    const url = searchUrl.toString();

    try {
      const { data } = await firstValueFrom(this.httpService.get<string>(url));
      const parsed = (await parseStringPromise(data, {
        explicitArray: false,
      })) as BggSearchResponse;

      if (!parsed.items?.item) {
        return [];
      }

      const items = Array.isArray(parsed.items.item)
        ? parsed.items.item
        : [parsed.items.item];

      return items.map(
        (item): SearchResult => ({
          bggId: parseInt(item.$.id, 10),
          name: this.#extractName(item.name),
          yearPublished: item.yearpublished?.$.value
            ? parseInt(item.yearpublished.$.value, 10)
            : undefined,
        })
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.#logger.error(
        `Failed to search BGG for "${query}": ${errorMessage}`
      );

      const status =
        error instanceof AxiosError && error.response?.status
          ? error.response.status
          : HttpStatus.SERVICE_UNAVAILABLE;

      throw new HttpException(
        {
          code: ERROR_CODE.BGG_API_ERROR,
          message: `BoardGameGeek API error: ${errorMessage}`,
          query,
        },
        status,
        { cause: error }
      );
    }
  }

  async getGameDetails(bggId: number): Promise<BggGameDetails> {
    const cacheKey = `bgg:game:${bggId}`;

    const cached = await this.cacheService.get<BggGameDetails>(cacheKey);
    if (cached) return cached;

    await this.#enforceRateLimit();
    const detailUrl = new URL("https://boardgamegeek.com/xmlapi2/thing");
    detailUrl.searchParams.set("id", String(bggId));
    detailUrl.searchParams.set("type", "boardgame,boardgameexpansion");
    const url = detailUrl.toString();

    try {
      const { data } = await firstValueFrom(this.httpService.get<string>(url));
      const parsed = (await parseStringPromise(data, {
        explicitArray: false,
      })) as BggDetailResponse;

      if (!parsed.items?.item) {
        throw new HttpException(
          {
            code: ERROR_CODE.BGG_GAME_NOT_FOUND,
            message: `Game with BGG ID ${bggId} not found`,
          },
          HttpStatus.NOT_FOUND
        );
      }

      const item = parsed.items.item;

      const result: BggGameDetails = {
        bggId,
        name: this.#extractName(item.name),
        yearPublished: item.yearpublished?.$.value
          ? parseInt(item.yearpublished.$.value, 10)
          : undefined,
        minPlayers: item.minplayers?.$.value
          ? parseInt(item.minplayers.$.value, 10)
          : undefined,
        maxPlayers: item.maxplayers?.$.value
          ? parseInt(item.maxplayers.$.value, 10)
          : undefined,
        playingTime: item.playingtime?.$.value
          ? parseInt(item.playingtime.$.value, 10)
          : undefined,
        minAge: item.minage?.$.value
          ? parseInt(item.minage.$.value, 10)
          : undefined,
        description: item.description,
        categories: this.#extractLinks(item.link, "boardgamecategory"),
        mechanics: this.#extractLinks(item.link, "boardgamemechanic"),
        publisher: this.#extractFirstLink(item.link, "boardgamepublisher"),
        thumbnailUrl: this.#normaliseImageUrl(item.thumbnail),
        imageUrl: this.#normaliseImageUrl(item.image),
        isExpansion: item.$.type === "boardgameexpansion",
      };

      await this.cacheService.set(cacheKey, result, 86400);

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.#logger.error(
        `Failed to fetch BGG game details for ${bggId}: ${errorMessage}`
      );

      throw new HttpException(
        {
          code: ERROR_CODE.BGG_API_ERROR,
          message: `Failed to fetch game details from BGG: ${errorMessage}`,
          bggId,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
        { cause: error }
      );
    }
  }

  #extractLinks(
    links:
      | { $: { type: string; id: string; value: string } }
      | Array<{ $: { type: string; id: string; value: string } }>
      | undefined,
    type: string
  ): string[] {
    if (!links) return [];
    const linkArray = Array.isArray(links) ? links : [links];
    return linkArray
      .filter((link) => link.$.type === type)
      .map((link) => link.$.value);
  }

  #extractFirstLink(
    links:
      | { $: { type: string; id: string; value: string } }
      | Array<{ $: { type: string; id: string; value: string } }>
      | undefined,
    type: string
  ): string | undefined {
    const results = this.#extractLinks(links, type);
    return results[0];
  }
}
