import type { ApexAxisChartSeries, ApexChart, ApexTitleSubtitle, ApexXAxis } from 'ng-apexcharts';

export interface ChartOptions {
	series: ApexAxisChartSeries | number[];
	chart: ApexChart;
	title: ApexTitleSubtitle;
	xaxis?: ApexXAxis;
	labels?: string[];
}

export interface StatsData {
	gamesByCategory: { name: string; value: number }[];
	complexityDistribution: { name: string; value: number }[];
	collectionGrowth: { x: string; y: number }[];
	totalGames: number;
}
