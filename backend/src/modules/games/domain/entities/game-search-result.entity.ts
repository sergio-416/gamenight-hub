export interface GameSearchResult {
	bggId: number;
	name: string;
	yearPublished?: number;
	rank?: string;
	avgRating?: string;
	isExpansion?: boolean;
	source: 'local' | 'bgg';
}
