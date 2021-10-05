import { Component } from '@angular/core';
import { ParamMap } from '@angular/router';
import { ActivatedRoute, Data } from '@angular/router';

import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';
import { Subject, Observable, throwError, forkJoin } from 'rxjs';
import { takeUntil, map, catchError, switchMap, take } from 'rxjs/operators';
import { LegendPosition } from '@swimlane/ngx-charts';
import { MultiSeries } from '@swimlane/ngx-charts/lib/models/chart-data.model';

import { RouteStateService } from '../../common/route-state-service/router-state-service';
import { IErrReport } from '../../common/config';
import { IMember } from '../../data-providers/members.data-provider';
import {
  ISession,
  ISessionWithoutId,
} from '../../data-providers/sessions.data-provider';

@Component({
  selector: 'pp-sessions-chart',
  templateUrl: './sessions-chart.component.html',
  styleUrls: ['./sessions-chart.component.scss'],
})
export class SessionsChartComponent {
  #destroy = new Subject<void>();
  #toastrMessage = 'A member access error has occurred';
  #sessions!: ISession[];
  member$!: Observable<IMember>;
  member!: IMember;
  /* dataset to be charted - it must be in a specific format as per the type */
  data!: MultiSeries;
  /* chart size */
  view: any = [700, 400];
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'],
  };
  gradient = false;
  showXAxis = true;
  showYAxis = true;
  showLegend = true;
  legendTitle = 'Sessions Load';
  legendPosition = LegendPosition.Below;
  /* gridlines start on an axis value (?) */
  roundDomains = true;
  showGridLines = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  xAxisLabel = 'Date';
  yAxisLabel = 'Metric';
  /* array of x-axis ticks - filled below */
  xAxisTicks: Date[] = [];
  /* function that formats x-axis ticks */
  xAxisTickFormatting = this.formatDate;
  rotateXAxisTicks = true;
  autoScale = true;
  /* shows selectable timeline below the chart */
  timeline = true;

  constructor(
    private route: ActivatedRoute,
    private routeStateService: RouteStateService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${SessionsChartComponent.name}: Starting SessionsChartComponent`,
    );

    this.isLoadingService.add(
      /* get the data as supplied from the route resolver */
      this.route.data
        .pipe(
          takeUntil(this.#destroy),
          take(1),
          switchMap((data: Data) => {
            this.member$ = data.memberAndSessions.member;
            return forkJoin([
              data.memberAndSessions.member as Observable<IMember>,
              data.memberAndSessions.sessions as Observable<ISession[]>,
            ]);
          }),
          map((memberAndSessions) => {
            /* loads sessions and member locally */
            this.member = memberAndSessions[0];
            this.#sessions = memberAndSessions[1];
            /* generate the chart dataset */
            this.data = this.genDateVsMetricData(this.member, this.#sessions);
            /* sum duplicate date values */
            this.sumDuplicates(this.data);
            /* generate the x-axis values */
            this.xAxisTicks = this.genXAxisTicks(this.data);
          }),
          catchError((err: IErrReport) => {
            this.logger.trace(
              `${SessionsChartComponent.name}: catchError called`,
            );

            /* inform user and mark as handled */
            this.toastr.error('ERROR!', this.#toastrMessage);
            err.isHandled = true;

            this.logger.trace(
              `${SessionsChartComponent.name}: Throwing the error on`,
            );
            return throwError(err);
          }),
        )
        .subscribe(() => {
          this.logger.trace(`${SessionsChartComponent.name}: Chart created`);
        }),
    );
  }

  ngOnInit() {
    /* update routeStateService with the routed member id */
    this.route.paramMap
      .pipe(
        takeUntil(this.#destroy),
        take(1),
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was null');
          }
          return id;
        }),
        catchError((err: IErrReport) => {
          this.logger.trace(
            `${SessionsChartComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.#toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${SessionsChartComponent.name}: Throwing the error on`,
          );
          return throwError(err);
        }),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngOnDestroy(): void {
    this.#destroy.next();
    this.#destroy.complete();
  }

  /**
   * Adds a number of days to a date and returns the calculated date.
   * @param date The date to which the days are added.
   * @param nDays The number of days to be added.
   * @returns The calculated date.
   */
  addDaysToDate(date: Date, nDays: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + nDays);
    return result;
  }

  /**
   * Returns the minimum and maximum dates from a Sessions array.
   * @param sessions The sessions array. The sessions array may be empty. Each element has a property 'date' containing a date in string format.
   * @returns An array containing the unmodified minimum and maximum dates.
   * If an empty sessions array is passed in then a minimum date of 30 days ago and a maximum date of today is returned.
   */
  getMinMaxDate = (sessions: ISessionWithoutId[]): [min: Date, max: Date] => {
    //
    if (!sessions[0]) {
      return [new Date(this.addDaysToDate(new Date(), -30)), new Date()];
    }

    let min = sessions[0].date;
    let max = sessions[0].date;

    for (let i = 0; i < sessions.length; i++) {
      const date = sessions[i].date;
      min = date < min ? date : min;
      max = date > max ? date : max;
    }

    return [new Date(min), new Date(max)];
  };

  /**
   * Creates an array of dummy sessions with a session for each date from the minimum date of a passed in sessions array to the maximum date of the passed in sessions array. Each session's metric property is zero.
   * @param sessions The sessions array whose dates define the range of the returned array.
   * @returns The dummy sessions array.
   */
  dummySessionsForAllDates(sessions: ISessionWithoutId[]): ISessionWithoutId[] {
    const dummySession: ISessionWithoutId = {
      memberId: 0,
      date: '',
      type: '',
      score: 0,
      duration: 0,
      metric: 0,
      comment: 'DUMMY',
    };
    const dummySessions: ISessionWithoutId[] = [];
    const min = this.getMinMaxDate(sessions)[0];
    const max = this.getMinMaxDate(sessions)[1];
    let d = min;
    let i = 0;
    do {
      dummySessions[i] = {} as ISessionWithoutId;
      for (const [key, value] of Object.entries(dummySession)) {
        dummySessions[i][key] = value;
      }
      dummySessions[i++].date = d.toString();
      d = this.addDaysToDate(min, i);
    } while (d <= max);
    return dummySessions;
  }

  /**
   * Creates a dataset for the ngx-charts chart from an array of sessions data associated with a member. The sessions data has been modified to add sessions with metric = 0 for any dates for which there was no session.
   * @param member The current member, i.e. the member that has been selected by the user.
   * @param sessions The sessions associated with the current member.
   * @returns The dataset displayed by an ngx-charts chart.
   */
  genDateVsMetricData(
    member: IMember,
    sessions: ISessionWithoutId[],
  ): MultiSeries {
    const result: MultiSeries = [
      {
        name: member.name,
        series: [],
      },
    ];
    const sessionsWithAllDates =
      this.dummySessionsForAllDates(sessions).concat(sessions);
    sessionsWithAllDates.forEach((session, index) => {
      try {
        result[0].series[index] = {
          /* set name to a date and clean any time out */
          name: new Date(new Date(session.date).setHours(0, 0, 0, 0)),
          value: session.metric,
        };
      } catch (error) {
        console.error('Error charting a member session - review sessions data');
      }
    });
    return result;
  }

  /**
   * Takes a dataset that might contain multiple items having the same date value, sums all the metric values associated with such dates, and modifies that dataset to contain items containing unique dates only, where each date's metric value is the sum of the metric values associated with the multiple items that contained that date.
   * @param data An ngx charts dataset with potentially multiple items containing the same date.  This dataset is mutated by the function.
   * @returns void.
   */
  sumDuplicates(data: MultiSeries): void {
    const holder = {};
    data[0].series.forEach((item) => {
      if (holder.hasOwnProperty(item.name.toString())) {
        holder[item.name.toString()] =
          holder[item.name.toString()] + item.value;
      } else {
        holder[item.name.toString()] = item.value;
      }
    });

    const result = [];
    for (const property in holder) {
      result.push({ name: new Date(property), value: holder[property] });
    }

    data[0].series = result;
  }

  /**
   * Provides a set of dates for the x-axis of the chart.
   *
   * Takes a sessions dataset, which has already being modified to have items with unique dates, and returns a array of the dates in the dataset.
   * NOTE:  This does NOT remove duplicates.
   * @param data An ngx charts dataset with all items containing unique dates.
   * @returns An array of dates from the dataset.
   */
  genXAxisTicks(data: MultiSeries): Date[] {
    const dates: Date[] = [];
    data[0].series.forEach((item, index) => {
      dates[index] = item.name as Date;
    });
    return dates;
  }

  /**
   * Formats the x-axis dates.
   * @param date A date value in unknown format
   * @returns A date with a specific format.
   */
  formatDate(date: Date) {
    const locale = 'en-IE';
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: '2-digit',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  }
}
