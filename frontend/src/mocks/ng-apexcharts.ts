import { Component, input } from '@angular/core';

@Component({
	selector: 'apx-chart',
	template: '',
})
export class ChartComponent {
	series = input<unknown>();
	chart = input<unknown>();
	xaxis = input<unknown>();
	yaxis = input<unknown>();
	title = input<unknown>();
	labels = input<unknown>();
	colors = input<unknown>();
	dataLabels = input<unknown>();
	plotOptions = input<unknown>();
	legend = input<unknown>();
	fill = input<unknown>();
	stroke = input<unknown>();
	tooltip = input<unknown>();
	responsive = input<unknown>();
	markers = input<unknown>();
	noData = input<unknown>();
	grid = input<unknown>();
	states = input<unknown>();
	subtitle = input<unknown>();
	theme = input<unknown>();
	autoUpdateSeries = input<unknown>();
}
