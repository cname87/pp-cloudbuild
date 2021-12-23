import { AfterViewInit, Component, Input } from '@angular/core';

import { NGXLogger } from 'ngx-logger';
import { SingleSeries } from '@swimlane/ngx-charts/lib/models/chart-data.model';
import { Color } from '@swimlane/ngx-charts';

/**
 * @title Summary chart data
 * This component shows a bar chart detailing one of the rows of the member summary data table.
 */
@Component({
  selector: 'summary-chart',
  templateUrl: './summary-chart.component.html',
  styleUrls: ['./summary-chart.component.scss'],
})
export class SummaryChartComponent implements AfterViewInit {
  /* dataset to be charted */
  @Input() data: SingleSeries = [];
  /* x-axis label */
  @Input() metric = 'Metric';

  elementWidth = document.getElementById('summary-table')?.scrollWidth;
  elementHeight = document.getElementById('summary-table')?.clientHeight;
  view: [number, number] = [
    this.elementWidth as number,
    this.elementHeight as number,
  ];
  barColor = getComputedStyle(document.documentElement).getPropertyValue(
    '--primary-color-normal',
  );
  colorScheme = {
    domain: [this.barColor],
  } as Color;
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = false;
  showYAxisLabel = true;

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${SummaryChartComponent.name}: Starting SummaryChartComponent`,
    );
  }

  ngAfterViewInit(): void {
    const chart = document.getElementById('summary-chart');
    /* scroll all the way to the right */
    if (chart) {
      chart.scrollLeft = chart.scrollWidth;
    }
  }
}
