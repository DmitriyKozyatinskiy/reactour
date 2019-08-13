import styled from 'styled-components';
import * as hx from '../helpers';
import * as c from '../constants';

// animation: ${props =>
//     props.isClosing
//       ? 'scale-out-center 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) both'
//       : 'none'}
const isIE = hx.isIE();

const getPosition = (props) => {
  const {
    targetTop,
    targetRight,
    targetBottom,
    targetLeft,
    windowWidth,
    windowHeight,
    helperWidth,
    helperHeight,
    helperPosition,
    padding = 0,
  } = props;

  const available = {
    left: targetLeft,
    right: windowWidth - targetRight,
    top: targetTop,
    bottom: windowHeight - targetBottom,
  };

  const couldPositionAt = position => {
    return (
      available[position] >
      (hx.isHoriz(position)
        ? helperWidth + padding * 2
        : helperHeight + padding * 2)
    );
  };

  const autoPosition = coords => {
    const positionsOrder = hx.bestPositionOf(available);
    for (let j = 0; j < positionsOrder.length; j++) {
      if (couldPositionAt(positionsOrder[j])) {
        return coords[positionsOrder[j]];
      }
    }
    return coords.center;
  };

  const pos = helperPosition => {
    const hX = hx.isOutsideX(targetLeft + helperWidth, windowWidth)
      ? hx.isOutsideX(targetRight + padding, windowWidth)
        ? targetRight - helperWidth
        : targetRight - helperWidth + padding
      : targetLeft - padding;
    const x = hX > padding ? hX : padding;
    const hY = hx.isOutsideY(targetTop + helperHeight, windowHeight)
      ? hx.isOutsideY(targetBottom + padding, windowHeight)
        ? targetBottom - helperHeight
        : targetBottom - helperHeight + padding
      : targetTop - padding;
    const y = hY > padding ? hY : padding;
    const coords = {
      top: [x, targetTop - helperHeight - padding * 2],
      right: [targetRight + padding * 2, y],
      bottom: [x, targetBottom + padding * 2],
      left: [targetLeft - helperWidth - padding * 2, y],
      center: [
        windowWidth / 2 - helperWidth / 2,
        windowHeight / 2 - helperHeight / 2,
      ],
    };
    if (helperPosition === 'center' || couldPositionAt(helperPosition)) {
      return coords[helperPosition];
    }
    return autoPosition(coords);
  };

  return pos(helperPosition);
};

const Guide = styled.div`
  --reactour-accent: ${props => props.accentColor};
  position: fixed;
  background-color: #fff;
  padding: 24px 30px;
  box-shadow: 0 0.5em 3em rgba(0, 0, 0, 0.3);
  #top: ${props => `${props.initialTop}px` || 0};
  #left: ${props => `${props.initialLeft}px` || 0};
  color: inherit;
  z-index: 1000000;
  max-width: 331px;
  min-width: 150px;
  outline: none !important;
  padding-right: 40px;
  border-radius: ${props => props.rounded}px;
  animation: ${props => {
    if (!props.helperWidth || !props.helperHeight) {
      return 'none';
    }
    
    if (props.isClosing && props.shouldDisappearOnClose) {
      if (props.animationType === 'flicker') {
        return 'flicker-out 0.5s linear both';
      } else {
        return 'scale-out-center 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) both'
      }
    } else {
      if (props.shouldAppearStatically) {
        return 'scale-in 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) both';
      } else {
        return 'none';
      }
    }
  }}
  transition: ${props =>
    props.shouldAppearStatically
      ? `transform ${c.GUIDE_ANIMATION_TIME}ms`
      : `transform ${c.GUIDE_ANIMATION_TIME}ms`}
  ${props => {
    const {
      animationType,
      shouldAppearStatically,
      shouldDisappearOnClose,
      isClosing,
      initialTop,
      initialLeft,
    } = props;
    const p = getPosition(props);
    
    let transform;
    if (shouldAppearStatically) {
      transform = isClosing && shouldDisappearOnClose && animationType !== 'flicker' ? 'scale(0)' : 'scale(1)'
    } else {
      transform = isIE ? `translateX(${p[0]}px) translateX(-${initialLeft}px) translateY(${p[1]}px) translateY(-${initialTop}px) ${
        isClosing && shouldDisappearOnClose && animationType !== 'flicker'
          ? 'scale(0)'
          : 'scale(1)'
      }` : `translate(calc(${p[0]}px - ${initialLeft}px), calc(${p[1]}px - ${initialTop}px)) ${
        isClosing && shouldDisappearOnClose && animationType !== 'flicker'
          ? 'scale(0)'
          : 'scale(1)'
      }`;
    }
    
    return `
      top: calc(${p[1]}px - ${initialTop}px);
      left: calc(${p[0]}px - ${initialLeft}px);
      transform: ${transform};
    `;
  }};
`;

export default Guide;
