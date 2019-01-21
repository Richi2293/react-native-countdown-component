import React from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  AppState
} from 'react-native';
import _ from 'lodash';
import {sprintf} from 'sprintf-js';

const DEFAULT_DIGIT_STYLE = {backgroundColor: '#FAB913'};
const DEFAULT_DIGIT_TXT_STYLE = {color: '#000'};
const DEFAULT_TIME_LABEL_STYLE = {color: '#000'};
const DEFAULT_TIME_TO_SHOW = ['D', 'H', 'M', 'S'];
const DEFAULT_TIME_LABELS = {
  d: 'Days',
  h: 'Hours',
  m: 'Minutes',
  s: 'Seconds',
};

class CountDown extends React.Component {
  static propTypes = {
    digitStyle: PropTypes.object,
    digitTxtStyle: PropTypes.object,
    timeLabelStyle: PropTypes.object,
    timeToShow: PropTypes.array,
    size: PropTypes.number,
    until: PropTypes.number,
    onChange: PropTypes.func,
    onPress: PropTypes.func,
    onFinish: PropTypes.func,
    running: PropTypes.bool
  };

  state = {
    until: Math.max(this.props.until, 0),
    wentBackgroundAt: null,
  };

  componentDidMount() {
    if (this.props.onFinish) {
      this.onFinish = _.once(this.props.onFinish);
    }
    if(this.props.running != false) {
      this.timer = setInterval(this.updateTimer, 1000);
    }
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.until !== nextProps.until) {
      this.setState({
        until: Math.max(nextProps.until, 0)
      });
      if ((!this.timer)&&(nextProps.running != false)) {
          this.timer = setInterval(this.updateTimer, 1000);
      }
    }
    if (this.props.running !== nextProps.running) {
      if(nextProps.running == false) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if(nextProps.running == true) {
        this.timer = setInterval(this.updateTimer, 1000);
      }
    }
  }

  _handleAppStateChange = currentAppState => {
    const {until, wentBackgroundAt} = this.state;
    if (currentAppState === 'active' && wentBackgroundAt) {
      const diff = (Date.now() - wentBackgroundAt) / 1000.0;
      this.setState({until: Math.max(0, until - diff)});
    }
    if (currentAppState === 'background') {
      this.setState({wentBackgroundAt: Date.now()});
    }
  }

  getTimeLeft = () => {
    const {until} = this.state;
    return {
      seconds: until % 60,
      minutes: parseInt(until / 60, 10) % 60,
      hours: parseInt(until / (60 * 60), 10) % 24,
      days: parseInt(until / (60 * 60 * 24), 10),
    };
  };

  updateTimer = () => {
    const {until} = this.state;

    if (until <= 1) {
      clearInterval(this.timer);
      this.timer = null;
      this.setState({until: 0});
      if (this.onFinish) {
        this.onFinish();
      }
    } else {
      if (this.props.onChange) {
        this.props.onChange();
      }
      this.setState({until: until - 1});
    }
  };

  renderDigit = (d) => {
    const {digitStyle, digitTxtStyle, size} = this.props;
    return (
      <View style={[
        styles.digitCont,
        digitStyle,
        {width: size * 2.3, height: size * 2.6},
      ]}>
        <Text style={[
          styles.digitTxt,
          {fontSize: size},
          digitTxtStyle,
        ]}>
          {d}
        </Text>
      </View>
    );
  };

  renderDoubleDigits = (label, digits) => {
    const {timeLabelStyle, size} = this.props;

    return (
      <View style={styles.doubleDigitCont}>
        <View style={styles.timeInnerCont}>
          {this.renderDigit(digits)}
        </View>
        <Text style={[
          styles.timeTxt,
          {fontSize: size / 1.8},
          timeLabelStyle,
        ]}>
          {label}
        </Text>
      </View>
    );
  };

  renderCountDown = () => {
    const {timeToShow, timeLabels} = this.props;
    const {until} = this.state;
    const {days, hours, minutes, seconds} = this.getTimeLeft();
    const newTime = sprintf('%02d:%02d:%02d:%02d', days, hours, minutes, seconds).split(':');
    const Component = this.props.onPress ? TouchableOpacity : View;

    return (
      <Component
        style={styles.timeCont}
        onPress={this.props.onPress}
      >
        {_.includes(timeToShow, 'D') ? this.renderDoubleDigits(timeLabels.d, newTime[0]) : null}
        {_.includes(timeToShow, 'H') ? this.renderDoubleDigits(timeLabels.h, newTime[1]) : null}
        {_.includes(timeToShow, 'M') ? this.renderDoubleDigits(timeLabels.m, newTime[2]) : null}
        {_.includes(timeToShow, 'S') ? this.renderDoubleDigits(timeLabels.s, newTime[3]) : null}
      </Component>
    );
  };

  render() {
    return (
      <View style={this.props.style}>
        {this.renderCountDown()}
      </View>
    );
  }
}

CountDown.defaultProps = {
  digitStyle: DEFAULT_DIGIT_STYLE,
  digitTxtStyle: DEFAULT_DIGIT_TXT_STYLE,
  timeLabelStyle: DEFAULT_TIME_LABEL_STYLE,
  timeLabels: DEFAULT_TIME_LABELS,
  timeToShow: DEFAULT_TIME_TO_SHOW,
  until: 0,
  size: 15,
  running: true
};

const styles = StyleSheet.create({
  timeCont: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeTxt: {
    color: 'white',
    marginVertical: 2,
    backgroundColor: 'transparent',
  },
  timeInnerCont: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitCont: {
    borderRadius: 5,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleDigitCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitTxt: {
    color: 'white',
    fontWeight: 'bold',
    fontVariant: ['tabular-nums']
  },
});

module.exports = CountDown;
