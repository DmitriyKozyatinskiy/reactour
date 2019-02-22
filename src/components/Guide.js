import styled from 'styled-components'
import * as hx from '../helpers'
import * as c from '../constants'

// animation: ${props =>
//     props.isClosing
//       ? 'scale-out-center 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) both'
//       : 'none'}

const Guide = styled.div`
  --reactour-accent: ${props => props.accentColor};
  position: fixed;
  background-color: #fff;
  transition: transform ${c.GUIDE_ANIMATION_TIME}ms;
  padding: 24px 30px;
  box-shadow: 0 0.5em 3em rgba(0, 0, 0, 0.3);
  top: ${props => `${props.initialTop}px` || 0};
  left: ${props => `${props.initialLeft}px` || 0};
  color: inherit;
  z-index: 1000000;
  max-width: 331px;
  min-width: 150px;
  outline: 0;
  padding-right: 40px;
  border-radius: ${props => props.rounded}px;
  animation: ${props =>
    props.isClosing &&
    props.shouldDisappearOnClose &&
    props.animationType === 'flicker'
      ? 'flicker-out 0.5s linear both;'
      : 'none'}

  transform: ${props => {
    const {
      animationType,
      shouldDisappearOnClose,
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      windowWidth,
      windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      padding,
      isClosing,
      initialTop,
      initialLeft,
    } = props

    const available = {
      left: targetLeft,
      right: windowWidth - targetRight,
      top: targetTop,
      bottom: windowHeight - targetBottom,
    }

    const couldPositionAt = position => {
      return (
        available[position] >
        (hx.isHoriz(position)
          ? helperWidth + padding * 2
          : helperHeight + padding * 2)
      )
    }

    const autoPosition = coords => {
      const positionsOrder = hx.bestPositionOf(available)
      for (let j = 0; j < positionsOrder.length; j++) {
        if (couldPositionAt(positionsOrder[j])) {
          return coords[positionsOrder[j]]
        }
      }
      return coords.center
    }

    const pos = helperPosition => {
      const hX = hx.isOutsideX(targetLeft + helperWidth, windowWidth)
        ? hx.isOutsideX(targetRight + padding, windowWidth)
          ? targetRight - helperWidth
          : targetRight - helperWidth + padding
        : targetLeft - padding
      const x = hX > padding ? hX : padding
      const hY = hx.isOutsideY(targetTop + helperHeight, windowHeight)
        ? hx.isOutsideY(targetBottom + padding, windowHeight)
          ? targetBottom - helperHeight
          : targetBottom - helperHeight + padding
        : targetTop - padding
      const y = hY > padding ? hY : padding
      const coords = {
        top: [x, targetTop - helperHeight - padding * 2],
        right: [targetRight + padding * 2, y],
        bottom: [x, targetBottom + padding * 2],
        left: [targetLeft - helperWidth - padding * 2, y],
        center: [
          windowWidth / 2 - helperWidth / 2,
          windowHeight / 2 - helperHeight / 2,
        ],
      }
      if (helperPosition === 'center' || couldPositionAt(helperPosition)) {
        return coords[helperPosition]
      }
      return autoPosition(coords)
    }

    const p = pos(helperPosition)

    return `translate(calc(${p[0]}px - ${initialLeft}px), calc(${
      p[1]
    }px - ${initialTop}px)) ${
      isClosing && shouldDisappearOnClose && animationType !== 'flicker'
        ? 'scale(0)'
        : 'scale(1)'
    }`
  }};
`

export default Guide
