import React from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'

interface ISegmentedControlProps {
  values: Record<string, any>[];
  selectedIndex: number;
  onTabPress: (action: Record<string, any>, tab: number) => void;
  config: Record<string, any>;
  tabsContainerStyle?: Record<string, any>;
  disabled?: boolean;
  static?: boolean;
  compact?: boolean;
}

interface ISegmentedControlState {
  selectedIndex: number,
  segmentDimension: Record<string, any>,
  activeSegmentPosition: Record<string, any>,
  positionAnimationValue: Animated.Value,
}

export default class SegmentedControlTab extends React.Component<ISegmentedControlProps, ISegmentedControlState> {
  private offsetHeight = 3

  state = {
    selectedIndex: this.props.selectedIndex,
    segmentDimension: { width: 320, height: this.props.compact ? 26 : 32 },
    activeSegmentPosition: { x: this.offsetHeight, y: this.offsetHeight },
    positionAnimationValue: new Animated.Value(0)
  }

  onSegmentSelection = (action, index) => {
    const animate = () => {
      Animated.timing(this.state.positionAnimationValue, {
        toValue: this.state.activeSegmentPosition.x,
        duration: this.props.static ? 0 : 80,
        easing: Easing.ease,
        useNativeDriver: false
      }).start(() => setTimeout(() => this.props.onTabPress(action, index), this.props.static ? 1 : 80))
    }

    this.setState(
      prevState => ({
        selectedIndex: index,
        activeSegmentPosition: { x: prevState.segmentDimension.width * index + this.offsetHeight, y: prevState.activeSegmentPosition.y }
      }),
      animate
    )
  }

  segmentOnLayout = event => {
    const { width, height } = event.nativeEvent.layout
    const segmentWidth = (width - this.offsetHeight * 2) / this.props.values.length

    const animate = () => {
      Animated.timing(this.state.positionAnimationValue, {
        toValue: segmentWidth * this.state.selectedIndex + this.offsetHeight,
        duration: this.props.static ? 0 : 80,
        useNativeDriver: false
      }).start()
    }

    this.setState(() => ({
      segmentDimension: { width: segmentWidth, height }
    }), animate)
  }

  render() {
    const { disabled } = this.props
    const { width, height } = this.state.segmentDimension

    return (
      <View
        style={[styles.segmentContainer, this.props.tabsContainerStyle, { backgroundColor: this.props.config.dark ? '#323232' : '#EFEFEF', height, borderRadius: height / 2, opacity: disabled ? 0.5 : 1, paddingHorizontal: this.offsetHeight }]}
        onLayout={this.segmentOnLayout}
        pointerEvents={disabled ? 'none' : 'auto'}
      >
        {this.props.values.map(({ text, mode, onPress }, index) => (
          <Pressable
            key={'segmented_control_tab_' + index}
            style={[styles.segment, styles.touchableSegment, { height: height - this.offsetHeight * 2 }]}
            onPress={() => this.onSegmentSelection({ text, mode, onPress }, index)}
          >
            <Text style={[styles.defaultText, { color: this.props.config.secondaryColor }, this.props.values.length > 3 && { fontSize: 12 }, index !== this.state.selectedIndex ? {} : { color: this.props.config.dark ? 'white' : this.props.config.mainColor }]}>{text}</Text>
          </Pressable>
        ))}
        <Animated.View
          style={[
            {
              width,
              height: height - this.offsetHeight * 2,
              left: this.state.positionAnimationValue,
              top: this.state.activeSegmentPosition.y
            },
            styles.segment,
            styles.activeSegment,
            { backgroundColor: this.props.config.dark ? '#646464' : 'white' }
          ]}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  segmentContainer: {
    // width: 330,
    marginTop: 7,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  activeSegment: {
    flex: 1,
    zIndex: 5,
    borderRadius: 40,
    position: 'absolute',
  },

  touchableSegment: {
    zIndex: 10,
  },

  animatedView: {
    zIndex: 5,
    position: 'absolute'
  },

  defaultText: {
    fontFamily: 'TTNorms-Medium',
    fontSize: 14,
    textAlign: 'center'
  }
})
