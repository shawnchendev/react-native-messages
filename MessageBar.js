// Peer dependecies
/* eslint-disable import/no-unresolved, import/extensions */
import React, { Component } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, SafeAreaView } from 'react-native';
/* eslint-enable import/no-unresolved, import/extensions */

import messageManager from './messageManager';

const MIN_SWIPE_DISTANCE = 20;
const MIN_SWIPE_VELOCITY = 0.15;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },

  message: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'grey'
  },
  messageText: {
    color: 'white',
    fontSize: 18
  },
});

function Message({ message, messageContainer, messageText }) {
  return (

    <View style={[styles.message, messageContainer]}>
      <Text style={messageText || styles.messageText}>{message}</Text>
    </View>
  );
}

export default class MessageBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisibleAnimValue: new Animated.Value(0),
      isAnimatingHide: false,
      message: null,
      config: {},
    };
  }
  componentWillMount() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gesture) => (
        this.getConfig().closeOnSwipe
        && gesture.dy < -MIN_SWIPE_DISTANCE
        && gesture.vy < -MIN_SWIPE_VELOCITY
      ),
      onPanResponderMove: (e, gesture) => {
        if (!this.state.isAnimatingHide) {
          this.hideMessage(this.state.message);
        }
      },
      onShouldBlockNativeResponder: () => true,
    });
  }
  componentDidMount() {
    messageManager.registerMessageBar(this);
  }
  componentWillUnmount() {
    messageManager.unregisterMessageBar();
  }
  getConfig() {
    return Object.assign({}, this.props, this.state.config);
  }
  pushMessage(message, config) {
    this.setState({ message, config }, () => this.showMessage(message));
  }
  showMessage(message) {
    const { duration, showAnimationDuration } = this.getConfig();
    this.state.isVisibleAnimValue.setValue(0);
    this.setState({ isAnimatingHide: false });
    Animated.timing(
      this.state.isVisibleAnimValue,
      { toValue: 1, duration: showAnimationDuration, useNativeDriver: true },
    ).start(() => setTimeout(() => this.hideMessage(message), duration));
  }
  hideMessage(message) {
    if (message === this.state.message) {
      const { hideAnimationDuration } = this.getConfig();
      this.setState({ isAnimatingHide: true });
      Animated.timing(
        this.state.isVisibleAnimValue,
        { toValue: 0, duration: hideAnimationDuration, useNativeDriver: true },
      ).start(() => {
        if (message === this.state.message) {
          this.setState({ message: null, config: {}, isAnimatingHide: false });
        }
      });
    }
  }
  render() {
    let { messageComponent: MessageComponent, slideAnimationOffset, messageContainer, messageText } = this.getConfig();

    const translateY = this.state.isVisibleAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [slideAnimationOffset, 0],

    });
    const opacity = this.state.isVisibleAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    console.log(this.getConfig())
    return (
      <Animated.View
        style={[
          styles.root,
          { transform: [{ translateY }] },
          { opacity },
        ]}
      >
        <SafeAreaView {...this.panResponder.panHandlers}>
          {this.state.message &&
            <MessageComponent message={this.state.message.message} messageContainer={messageContainer} messageText={messageText} />
          }
        </SafeAreaView>
      </Animated.View>
    );
  }
}

MessageBar.defaultProps = {
  messageComponent: Message,
  duration: 1000,
  slideAnimationOffset: -40,
  showAnimationDuration: 255,
  hideAnimationDuration: 255,
  closeOnSwipe: true,
  position: 'top',
  messageContainer: null,
  messageText: null,
};
