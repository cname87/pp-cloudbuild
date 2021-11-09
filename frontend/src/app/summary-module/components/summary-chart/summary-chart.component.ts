import { Component, Input } from '@angular/core';

import { NGXLogger } from 'ngx-logger';
import { SingleSeries } from '@swimlane/ngx-charts/lib/models/chart-data.model';

/**
 * @title Summary chart data
 * This component shows a bar chart detailing one of the rows of the member summary data table.
 */
@Component({
  selector: 'summary-chart',
  templateUrl: './summary-chart.component.html',
  styleUrls: ['./summary-chart.component.scss'],
})
export class SummaryChartComponent {
  /* dataset to be charted */
  @Input() data: SingleSeries = [];
  /* x-axis label */
  @Input() metric = 'Metric';
  elementWidth = document.getElementById('summary-table')?.scrollWidth || 2147;
  elementHeight = document.getElementById('summary-table')?.clientHeight || 398;
  view: [number, number] = [this.elementWidth, this.elementHeight];
  barColor = getComputedStyle(document.documentElement).getPropertyValue(
    '--primary-color-lighter',
  );
  colorScheme = {
    domain: [this.barColor],
  };
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = false;
  showYAxisLabel = true;

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${SummaryChartComponent.name}: Starting SummaryChartComponent`,
    );
  }
}
