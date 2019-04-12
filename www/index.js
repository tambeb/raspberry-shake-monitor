'use strict'
Vue.config.silent = true;
var serverUrl = location.origin + '/';
Chart.defaults.global.animation.duration = 0;
Chart.defaults.global.tooltips.enabled = false;
Chart.defaults.global.defaultFontColor = 'rgba(0, 0, 0, .75)';
Chart.defaults.global.defaultFontFamily = "'Open Sans', sans-serif";
Chart.defaults.global.defaultFontStyle = "normal";

function isMobileDevice() {
  if ( window.outerWidth <= 800 ) {
    return true;
  }
};

var mobile = isMobileDevice();

Vue.config.errorHandler = function ( err, vm, info ) {
}

Vue.config.warnHandler = function ( msg, vm, trace ) {
}

function getChartById( id ) {
  for ( let i in Chart.instances ) {
    if ( Chart.instances[ 0 ].canvas.id == id ) {
      return Chart.instances[ i ];
    }
  }
}

var lineChart = {
  template: `<div @mouseover="mouseOver"
  @mouseleave="mouseLeave">
<div class="chart-title">
 <div class="dropdown">
   <div class="haveCursor"
        :class="{ invisible: !iconVisibility, visible: iconVisibility }">
     <i class="icon-image-preview outline-swap_vert resize haveCursor margin-left-right">
     </i>
   </div>
   <div class="dropdown-content">
     <a href="#">Y-Axis Min Range</a>
     <a href="#"
        @click="onSelect(x)"
        v-for="x in app.settings['axisTickIntervalOptions']"
        href="#"
        :value="x">{{x}}
     </a>
   </div>
 </div>
 <h3 class="center"
     v-text="this.name.toUpperCase() + ' - ' + this.timeHorizon">
 </h3>
</div>
<div class="chart chart-container">
 <canvas :id="id"
         :name="name">
 </canvas>
</div>
</div>`,
  props: [ 'id', 'name' ],
  data: function () {
    return {
      chart: false,
      id: false,
      name: false,
      shakeData: false,
      timeHorizon: false,
      ctx: false,
      iconVisibility: false
    }
  },
  methods: {
    dropdownRightIfMobile: function ( value ) {
      return {
        'dropdown-right': mobile
      };
    },
    onSelect: function ( value ) {
      let name = this.name.toLowerCase() + 'AxisTickInterval';
      app.sendSetting( name, value );
    },
    mouseOver: function () {
      this.iconVisibility = true;
    },
    mouseLeave: function () {
      this.iconVisibility = false;
    },
    prettyTimeHorizon: function ( interval ) {
      interval = interval.toString();
      switch ( interval ) {
        case '5':
          return '5 secs';
        case '10':
          return '10 secs';
        case '30':
          return '30 secs';
        case '60':
          return '1 min';
        case '120':
          return '2 mins';
        case '300':
          return '5 mins';
        case '600':
          return '10 mins';
        case '900':
          return '15 mins';
        case '1200':
          return '20 mins';
        case '1800':
          return '30 mins';
        case '3600':
          return '1 hr';
        case '5400':
          return '1.5 hrs';
        case '7200':
          return '2 hrs';
      }
    },
    prettyDateTime: function ( data ) {
      let fullDate = new Date( data );
      let hour = fullDate.getHours();
      var minute = fullDate.getMinutes();
      var second = fullDate.getSeconds();
      let prettyTime;
      if ( hour > 12 ) {
        hour = hour - 12;
        prettyTime = _.padStart( hour, 2, '0' ) + ':' + _.padStart( minute, 2, '0' ) + ':' + _.padStart( second, 2, '0' ) + 'p';
      }
      else if ( hour == 0 ) {
        hour = 12;
        prettyTime = _.padStart( hour, 2, '0' ) + ':' + _.padStart( minute, 2, '0' ) + ':' + _.padStart( second, 2, '0' ) + 'a';
      }
      else if ( hour == 12 ) {
        prettyTime = _.padStart( hour, 2, '0' ) + ':' + _.padStart( minute, 2, '0' ) + ':' + _.padStart( second, 2, '0' ) + 'p';
      }
      else {
        prettyTime = _.padStart( hour, 2, '0' ) + ':' + _.padStart( minute, 2, '0' ) + ':' + _.padStart( second, 2, '0' ) + 'a';
      }
      return prettyTime;
    },
    whichInterval: function ( whichChart ) {
      return app.settings[ whichChart.toLowerCase() + 'AxisTickInterval' ];
    },
    refreshComponentData: function () {
      for ( let i in app.lineCharts ) {
        if ( this.name == app.lineCharts[ i ][ 'name' ] ) {
          this.shakeData = app.lineCharts[ i ][ 'data' ];
        }
      }
    },
    createChart: function () {
      this.refreshComponentData();
      this.timeHorizon = this.prettyTimeHorizon( app.settings[ 'timeHorizon' ] );
      this.chart = new Chart( this.ctx, {
        responsive: true,
        plugins: [ downsamplePlugin ],
        type: 'line',
        data: {
          datasets: [ {
            borderColor: '#917464',
            data: this.shakeData,
            fill: false,
            borderWidth: 1,
            lineTension: 0,
            pointRadius: 0,
            showLine: true
          } ]
        },
        options: {
          animation: {
            duration: 0
          },
          downsample: {
            enabled: true,
            threshold: 1000,
            auto: false,
            onInit: true,
            preferOriginalData: false,
            restoreOriginalData: false
          },
          title: {
            display: false,
            text: this.name.toUpperCase() + ' - ' + this.timeHorizon,
            fontSize: 20
          },
          hover: {
            animationDuration: 0
          },
          responsiveAnimationDuration: 0,
          tooltips: {
            enabled: false
          },
          elements: {
            line: {
              tension: 0
            }
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [ {
              gridLines: {
                display: false,
                drawBorder: false
              },
              type: 'time',
              distribution: 'linear',
              ticks: {
                autoSkip: true,
                autoSkipPadding: 20
              },
              time: {
                unit: 'millisecond',
                displayFormats: {
                  millisecond: 'hh:mm:ss a'
                }
              }
            } ],
            yAxes: [ {
              padding: 10,
              gridLines: {
                color: 'rgba(0,0,0,0.05)',
                drawBorder: false
              },
              ticks: {
                autoSkip: true,
                padding: 10
              }
            } ]
          }
        }
      }
      )
    },
    updateChart: function ( throttle ) {
      this.refreshComponentData();
      this.chart.data.datasets[ 0 ].data = this.shakeData;
      this.chart.downsample();
      let whichChart = this.chart.options.title.text.slice( 0, 3 );
      let interval = this.whichInterval( whichChart );
      let max = this.axisMax( this.absMax( this.chart.data.datasets[ 0 ].data ), interval );
      this.chart.options.scales.yAxes[ 0 ].ticks.min = -1 * max;
      this.chart.options.scales.yAxes[ 0 ].ticks.max = 1 * max;
      this.timeHorizon = this.prettyTimeHorizon( app.settings[ 'timeHorizon' ] );
      this.chart.options.title.text = this.name.toUpperCase() + ' - ' + this.timeHorizon;
      this.chart.update();
      setTimeout( throttle, 250 );
    },
    absMax: function ( data ) {
      let max = _.maxBy( data, function ( o ) {
        return Math.abs( o.y );
      } )
      return Math.abs( max.y );
    },
    axisMax: function ( data, interval ) {
      return ( parseInt( data / interval ) + 1 ) * interval;
    }
  },
  mounted: function () {
    this.ctx = document.getElementById( this.id ).getContext( '2d' );
    this.createChart();
  },
  beforeDestroy: function () {
    this.shakeData = null;
  }
}

var lineChartHistorical = {
  template: `<div>
  <div class="chart-title">
    <h3 class="center"
        v-text="this.name.toUpperCase()">
    </h3>
  </div>
  <div class="chart chart-container">
    <canvas :id="id"
            :name="name">
    </canvas>
  </div>
</div>`,
  props: [ 'id', 'name' ],
  data: function () {
    return {
      chart: false,
      id: false,
      name: false,
      shakeData: false,
      ctx: false,
      iconVisibility: false
    }
  },
  methods: {
    onSelect: function ( selected ) {
      let name = this.name.toLowerCase() + 'AxisTickInterval';
      let value = selected.item.value;
      app.sendSetting( name, value );
    },
    whichInterval: function ( whichChart ) {
      return app.settings[ whichChart.toLowerCase() + 'AxisTickInterval' ];
    },
    refreshComponentData: function () {
      for ( let i in app.lineChartsHistorical ) {
        if ( this.name == app.lineChartsHistorical[ i ][ 'name' ] ) {
          this.shakeData = app.lineChartsHistorical[ i ][ 'data' ];
        }
      }
    },
    createChart: function () {
      this.refreshComponentData();
      this.chart = new Chart( this.ctx, {
        responsive: true,
        plugins: [ downsamplePlugin ],
        type: 'line',
        data: {
          datasets: [ {
            borderColor: '#917464',
            data: this.shakeData,
            fill: false,
            borderWidth: 1,
            lineTension: 0,
            pointRadius: 0,
            showLine: true
          } ]
        },
        options: {
          animation: {
            duration: 0
          },
          downsample: {
            enabled: true,
            threshold: 1000,
            auto: false,
            onInit: true,
            preferOriginalData: false,
            restoreOriginalData: false
          },
          title: {
            display: false,
            text: this.name.toUpperCase(),
            fontSize: 20
          },
          hover: {
            animationDuration: 0
          },
          responsiveAnimationDuration: 0,
          tooltips: {
            enabled: false
          },
          elements: {
            line: {
              tension: 0
            }
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [ {
              gridLines: {
                display: false,
                drawBorder: false
              },
              type: 'time',
              distribution: 'linear',
              ticks: {
                autoSkip: true,
                autoSkipPadding: 20
              },
              time: {
                unit: 'millisecond',
                displayFormats: {
                  millisecond: 'hh:mm:ss a'
                }
              }
            } ],
            yAxes: [ {
              padding: 10,
              gridLines: {
                color: 'rgba(0,0,0,0.05)',
                drawBorder: false
              },
              ticks: {
                autoSkip: true,
                padding: 10
              }
            } ]
          }
        }
      }
      )
      this.chart.downsample();
      let whichChart = this.name.toUpperCase();
      let interval = this.whichInterval( whichChart );
      let max = this.axisMax( this.absMax( this.chart.data.datasets[ 0 ].data ), interval );
      this.chart.options.scales.yAxes[ 0 ].ticks.min = -1 * max;
      this.chart.options.scales.yAxes[ 0 ].ticks.max = 1 * max;
      this.chart.update();
    },
    updateChart: function () {
      this.refreshComponentData();
      this.chart.data.datasets[ 0 ].data = this.shakeData;
      this.chart.downsample();
      let whichChart = this.chart.options.title.text.slice( 0, 3 );
      let interval = this.whichInterval( whichChart );
      let max = this.axisMax( this.absMax( this.chart.data.datasets[ 0 ].data ), interval );
      this.chart.options.scales.yAxes[ 0 ].ticks.min = -1 * max;
      this.chart.options.scales.yAxes[ 0 ].ticks.max = 1 * max;
      this.chart.options.title.text = this.name.toUpperCase();
      this.chart.update();
    },
    absMax: function ( data ) {
      let max = _.maxBy( data, function ( o ) {
        return Math.abs( o.y );
      } )
      return Math.abs( max.y );
    },
    axisMax: function ( data, interval ) {
      return ( parseInt( data / interval ) + 1 ) * interval;
    }
  },
  mounted: function () {
    this.ctx = document.getElementById( this.id ).getContext( '2d' );
    this.createChart();
  },
  beforeDestroy: function () {
    this.shakeData = null;
  }
}

var app = new Vue( {
  el: "#app",
  components: {
    'line-chart': lineChart,
    'line-chart-historical': lineChartHistorical
  },
  data: {
    disconnected: false,
    settings: {},
    settingsClone: {},
    saveChanges: false,
    topAppBarCollapsed: false,
    lineCharts: [],
    lineChartsHistorical: [],
    paused: false,
    pausedTitle: 'Pause',
    historical: false,
    historicalTitle: 'Historical Data',
    unwatch: {},
    secondaryTitle: 'Live',
    historicalLogsList: {
      year: false,
      month: false,
      day: false,
      hour: false
    },
    historicalRange: {
      year: false,
      month: false,
      day: false,
      hour: false
    }
  },
  computed: {
  },
  methods: {
    dropdownRightIfMobile: function ( value ) {
      return {
        'dropdown-right': mobile
      };
    },
    blankIfMobile: function ( value ) {
      if ( mobile ) {
        return '';
      }
      else {
        return value;
      }
    },
    marginRightIfNotMobile: function () {
      return {
        'margin-right': !mobile
      };
    },
    marginsAndPauseIcons: function () {
      return {
        'outline-play_arrow': this.paused,
        'outline-pause': !this.paused
      };
    },
    marginsAndHistoryIcons: function () {
      return {
        'outline-last_page': this.historical,
        'outline-date_range': !this.historical,
        'margin-right': !mobile
      };
    },
    onSelect: function ( name, value ) {
      this.sendSetting( name, value );
    },
    togglePause: function () {
      this.paused = !this.paused;
      if ( this.paused ) {
        this.pausedTitle = 'Resume';
        this.secondaryTitle = 'Paused';
      }
      else {
        this.pausedTitle = 'Pause';
        this.secondaryTitle = 'Live';
      }
    },
    toggleHistory: function () {
      this.historical = !this.historical;
      if ( this.historical ) {
        this.paused = true;
        this.historicalTitle = 'Back to Live';
        this.secondaryTitle = 'Historical';
        app.requestHistoricalList( app.historicalRange );
      }
      else {
        for ( let i in this.unwatch ) {
          this.unwatch[ i ]();
        }
        for ( let i in this.historicalLogsList ) {
          this.historicalLogsList[ i ] = false;
        }
        for ( let i in this.historicalRange ) {
          this.historicalRange[ i ] = false;
        }
        this.lineChartsHistorical = [];
        this.paused = false;
        this.historicalTitle = 'Historical Data';
        this.secondaryTitle = 'Live';
      }
    },
    ready: function () {
      if ( !this.paused && !this.dialogOpen ) {
        return true;
      }
      else return false;
    },
    requestHistoricalList: function ( data ) {
      socket.emit( 'getHistoricalList', data, function ( response ) {

        app.backtrackHistoricalRange( response.type );
        app.historicalLogsList[ response.type ] = response.data;
        app.unwatch[ response.type ] = app.$watch( 'historicalRange.' + response.type, function ( newVal, oldVal ) {
          if ( response.type != 'hour' ) {
            app.backtrackHistoricalRange( response.type );
            app.requestHistoricalList( app.historicalRange );
          }
          else {
            socket.emit( 'getHistoricalData', app.historicalRange, function ( response ) {
              app.lineChartsHistorical = [];
              app.lineChartsHistorical = response;
              app.$nextTick( function () {
                for ( let i in response ) {
                  let name = response[ i ].name;
                  app.$refs[ name + 'HistoricalChart' ][ 0 ].updateChart();
                }
              } )
            } )
          }
        } )
      } )
    },
    backtrackHistoricalRange: function ( resetPoint ) {
      let points = {
        year: 1,
        month: 2,
        day: 3,
        hour: 4
      }
      let resetPointValue = points[ resetPoint ];
      for ( let i in points ) {
        if ( points[ i ] > resetPointValue ) {
          try {
            this.unwatch[ i ]();
          }
          catch ( err ) { }
          this.historicalLogsList[ i ] = false;
          this.historicalRange[ i ] = false;
        }
      }
    },
    sendSetting: function ( name, value ) {
      let data = {
        setting: name,
        value: value
      }
      socket.emit( 'setting', data );
    },
    pauseStream: function ( value ) {
      socket.emit( 'pause', value );
    },
    addLineChart: function ( name, data ) {
      let index = this.lineCharts.findIndex( function ( o ) {
        return o.name == name;
      } );
      let newItem = {
        name: name,
        data: data
      };
      if ( index == -1 ) {
        this.lineCharts.push( newItem );
      }
      else {
        this.lineCharts.splice( index, 1, newItem );
      }
    },
    updateLineCharts: function ( name, data ) {
      let index = this.lineCharts.findIndex( function ( i ) {
        return i.name == name;
      } )
      this.lineCharts[ index ][ 'data' ] = data;
    }
  },
  mounted: function () {
    if ( 'serviceWorker' in navigator ) {
      navigator.serviceWorker.getRegistrations().then( function ( registrations ) {
        for ( var registration of registrations ) {
          registration.update();
        }
      } )
      navigator.serviceWorker.register( '/sw.js' ).then( function ( registration ) { } ).catch( function ( error ) { } )
    }
    this.$watch( 'paused', function ( newVal, oldVal ) {
      this.pauseStream( newVal );
    } )
  }
} )

var socket = io.connect( serverUrl, {
  reconnection: true
} );
socket.on( 'connect', function () {
  socket.on( 'settings', function ( data ) {
    if ( !_.isEqual( app.settings, data ) ) {
      app.settings = data;
    }
  } )
  socket.on( 'new', function ( data, response ) {
    for ( let i in data ) {
      let name = data[ i ].name;
      app.addLineChart( name, data[ i ].data );
      socket.on( name + '_update', function ( data, response ) {
        if ( app.ready() ) {
          app.updateLineCharts( data.name, data.data );
          app.$refs[ name + 'Chart' ][ 0 ].updateChart( response );
        }
        else {
          setTimeout( response, 100 );
        }
      } )
    }
    setTimeout( response, 100 );
  } )
  socket.on( 'disconnect', function () {
    app.disconnected = true;
    socket.on( 'reconnect', function () {
      window.location.replace( serverUrl );
    } )
  } )
} )
