import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CategoryFilterPill } from '@collection/components/category-filter-pill/category-filter-pill';
import { PlayerCountFilterPill } from '@collection/components/player-count-filter-pill/player-count-filter-pill';
import { SortPill } from '@collection/components/sort-pill/sort-pill';
import {
	type PlayerCountFilter,
	type SortMode,
	VIEW_MODE,
	type ViewMode,
} from '@collection/models/collection.types';
import { SearchInput } from '@shared/components/search-input/search-input';

@Component({
	selector: 'app-collection-toolbar',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	imports: [SearchInput, PlayerCountFilterPill, CategoryFilterPill, SortPill],
	templateUrl: './collection-toolbar.html',
})
export class CollectionToolbar {
	viewMode = input<ViewMode>(VIEW_MODE.GRID);
	searchQuery = input('');
	playerFilter = input.required<PlayerCountFilter>();
	categoryFilter = input.required<string>();
	sortMode = input.required<SortMode>();
	availableCategories = input.required<string[]>();

	viewModeChange = output<ViewMode>();
	searchChange = output<string>();
	playerFilterChange = output<PlayerCountFilter>();
	categoryFilterChange = output<string>();
	sortChange = output<SortMode>();

	readonly gridMode = VIEW_MODE.GRID;
	readonly listMode = VIEW_MODE.LIST;
}
