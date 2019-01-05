import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import scrollSmooth from 'scroll-smooth'
import Scrollparent from 'scrollparent'
import {
  Arrow,
  Close,
  Guide,
  Badge,
  Controls,
  Navigation,
  Dot,
  SvgMask,
} from './components/index'
import * as hx from './helpers'
import * as c from './constants'

class TourPortal extends Component {
  static propTypes = {
    badgeContent: PropTypes.func,
    highlightedMaskClassName: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.element]),
    className: PropTypes.string,
    closeWithMask: PropTypes.bool,
    inViewThreshold: PropTypes.number,
    isOpen: PropTypes.bool.isRequired,
    lastStepNextButton: PropTypes.node,
    maskClassName: PropTypes.string,
    maskSpace: PropTypes.number,
    nextButton: PropTypes.node,
    onAfterOpen: PropTypes.func,
    onBeforeClose: PropTypes.func,
    onRequestClose: PropTypes.func,
    prevButton: PropTypes.node,
    scrollDuration: PropTypes.number,
    scrollOffset: PropTypes.number,
    showButtons: PropTypes.bool,
    showCloseButton: PropTypes.bool,
    showNavigation: PropTypes.bool,
    showNavigationNumber: PropTypes.bool,
    showNumber: PropTypes.bool,
    startAt: PropTypes.number,
    goToStep: PropTypes.number,
    getCurrentStep: PropTypes.func,
    nextStep: PropTypes.func,
    prevStep: PropTypes.func,
    steps: PropTypes.arrayOf(
      PropTypes.shape({
        selector: PropTypes.string,
        content: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.element,
          PropTypes.func,
        ]).isRequired,
        position: PropTypes.oneOf(['top', 'right', 'bottom', 'left', 'center']),
        action: PropTypes.func,
        style: PropTypes.object,
        stepInteraction: PropTypes.bool,
      })
    ),
    update: PropTypes.string,
    updateDelay: PropTypes.number,
    disableInteraction: PropTypes.bool,
    disableDotsNavigation: PropTypes.bool,
    disableKeyboardNavigation: PropTypes.bool,
    rounded: PropTypes.number,
    accentColor: PropTypes.string,
    containerId: PropTypes.string,
    initialNodeId: PropTypes.string,
  }

  static defaultProps = {
    showNavigation: true,
    showNavigationNumber: true,
    showButtons: true,
    showCloseButton: true,
    showNumber: true,
    scrollDuration: 1,
    maskSpace: 10,
    updateDelay: 1,
    disableInteraction: false,
    rounded: 0,
    accentColor: '#007aff',
  }

  constructor() {
    super()
    this.state = {
      isOpen: false,
      isClosing: false,
      current: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      initialTop: 0,
      initialLeft: 0,
      width: 0,
      height: 0,
      w: 0,
      h: 0,
      inDOM: false,
      observer: null,
    }
    this.helper = createRef()
    this.helperElement = null
  }

  componentDidMount() {
    const { isOpen, startAt } = this.props
    if (isOpen) {
      this.open(startAt)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { isOpen, update, updateDelay } = this.props

    if (!isOpen && nextProps.isOpen) {
      this.open(nextProps.startAt)
    } else if (isOpen && !nextProps.isOpen) {
      this.close()
    }

    if (isOpen && update !== nextProps.update) {
      if (nextProps.steps[this.state.current]) {
        setTimeout(this.showStep, updateDelay)
      } else {
        this.hide()
      }
    }

    if (
      isOpen &&
      nextProps.isOpen &&
      this.state.current !== nextProps.goToStep
    ) {
      this.gotoStep(nextProps.goToStep)
    }
  }

  componentWillUnmount() {
    const { isOpen } = this.props
    if (isOpen) {
      this.close()
    }
    if (this.state.observer) {
      this.state.observer.disconnect()
    }
  }

  hide = event => {
    console.log('CLOSAE!!!!2fdg')
    const { initialNodeId, onRequestClose } = this.props

    this.setState(
      ({ initialTop, initialLeft }) => ({
        top: initialTop,
        left: initialLeft,
        isClosing: true,
      }),
      () =>
        window.setTimeout(() => {
          const initialNode = initialNodeId
            ? document.getElementById(initialNodeId)
            : null

          if (initialNode) {
            initialNode.style.display = ''
          }
          onRequestClose(event)
        }, c.GUIDE_ANIMATION_TIME - 50)
    )
  }

  open(startAt) {
    const { initialNodeId, onAfterOpen } = this.props

    console.log('UPDATEA')
    const initialNode = initialNodeId
      ? document.getElementById(initialNodeId)
      : null
    console.log('INITIAL NODE: ', initialNode)
    const initialCoordinates = initialNode ? hx.getNodeRect(initialNode) : null

    const initialTop = initialCoordinates ? initialCoordinates.top : 0
    const initialLeft = initialCoordinates ? initialCoordinates.left : 0

    if (initialNode) {
      initialNode.style.display = 'none'
    }

    console.log('COORDS: ', initialCoordinates)

    this.setState(
      prevState => ({
        isOpen: true,
        isClosing: false,
        initialTop,
        initialLeft,
        current: startAt !== undefined ? startAt : prevState.current,
      }),
      () => {
        this.showStep()
        this.helperElement = this.helper.current
        this.helper.current.focus()
        if (onAfterOpen) {
          onAfterOpen(this.helperElement)
        }
      }
    )
    // TODO: debounce it.
    window.addEventListener('resize', this.showStep, false)
    window.addEventListener('keydown', this.keyDownHandler, false)
  }

  showStep = () => {
    const { steps } = this.props
    const { current } = this.state
    const step = steps[current]
    const node = step.selector ? document.querySelector(step.selector) : null

    const stepCallback = o => {
      if (step.action && typeof step.action === 'function') {
        step.action(o)
      }
    }

    if (step.observe) {
      const target = document.querySelector(step.observe)
      const config = { attributes: true, childList: true, characterData: true }
      this.setState(
        prevState => {
          if (prevState.observer) {
            setTimeout(() => {
              prevState.observer.disconnect()
            }, 0)
          }
          return {
            observer: new MutationObserver(mutations => {
              mutations.forEach(mutation => {
                if (
                  mutation.type === 'childList' &&
                  mutation.addedNodes.length > 0
                ) {
                  const cb = () => stepCallback(mutation.addedNodes[0])
                  setTimeout(
                    () =>
                      this.calculateNode(
                        mutation.addedNodes[0],
                        step.position,
                        cb
                      ),
                    100
                  )
                } else if (
                  mutation.type === 'childList' &&
                  mutation.removedNodes.length > 0
                ) {
                  const cb = () => stepCallback(node)
                  this.calculateNode(node, step.position, cb)
                }
              })
            }),
          }
        },
        () => this.state.observer.observe(target, config)
      )
    } else {
      if (this.state.observer) {
        this.state.observer.disconnect()
        this.setState({
          observer: null,
        })
      }
    }

    if (node) {
      const cb = () => stepCallback(node)
      this.calculateNode(node, step.position, cb)
    } else {
      this.setState(
        setNodeState(null, this.helper.current, step.position),
        stepCallback
      )

      step.selector &&
        console.warn(
          `Doesn't find a DOM node '${step.selector}'.
                    Please check the 'steps' Tour prop Array at position: ${current +
                      1}.`
        )
    }
  }

  calculateNode = (node, stepPosition, cb) => {
    const { scrollDuration, inViewThreshold, scrollOffset } = this.props
    const attrs = hx.getNodeRect(node)
    const w = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    )
    const h = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    )
    if (!hx.inView({ ...attrs, w, h, threshold: inViewThreshold })) {
      const parentScroll = Scrollparent(node)
      scrollSmooth.to(node, {
        context: hx.isBody(parentScroll) ? window : parentScroll,
        duration: scrollDuration,
        offset: scrollOffset || -(h / 2),
        callback: nd => {
          this.setState(setNodeState(nd, this.helper.current, stepPosition), cb)
        },
      })
    } else {
      this.setState(setNodeState(node, this.helper.current, stepPosition), cb)
    }
  }

  close() {
    this.setState(prevState => {
      if (prevState.observer) {
        prevState.observer.disconnect()
      }
      return {
        isOpen: false,
        observer: null,
      }
    }, this.onBeforeClose)
    window.removeEventListener('resize', this.showStep)
    window.removeEventListener('keydown', this.keyDownHandler)
  }

  onBeforeClose() {
    const { onBeforeClose } = this.props
    if (onBeforeClose) {
      onBeforeClose(this.helperElement)
    }
  }

  maskClickHandler = e => {
    const { closeWithMask } = this.props
    if (
      closeWithMask &&
      !e.target.classList.contains(CN.mask.disableInteraction)
    ) {
      this.hide(e)
    }
  }

  nextStep = () => {
    const { steps, getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep =
        prevState.current < steps.length - 1
          ? prevState.current + 1
          : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  prevStep = () => {
    const { getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep =
        prevState.current > 0 ? prevState.current - 1 : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  gotoStep = n => {
    const { steps, getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep = steps[n] ? n : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  keyDownHandler = e => {
    const { nextStep, prevStep, disableKeyboardNavigation } = this.props
    e.stopPropagation()

    if (disableKeyboardNavigation) {
      return
    }

    if (e.keyCode === 27) {
      // esc
      e.preventDefault()
      this.hide()
    }
    if (e.keyCode === 39) {
      // right
      e.preventDefault()
      typeof nextStep === 'function' ? nextStep() : this.nextStep()
    }
    if (e.keyCode === 37) {
      // left
      e.preventDefault()
      typeof prevStep === 'function' ? prevStep() : this.prevStep()
    }
  }

  render() {
    const {
      className,
      steps,
      maskClassName,
      showButtons,
      showCloseButton,
      showNavigation,
      showNavigationNumber,
      showNumber,
      maskSpace,
      lastStepNextButton,
      nextButton,
      prevButton,
      badgeContent,
      highlightedMaskClassName,
      disableInteraction,
      disableDotsNavigation,
      nextStep,
      prevStep,
      rounded,
      accentColor,
      containerId,
    } = this.props

    const {
      isOpen,
      isClosing,
      current,
      inDOM,
      top: targetTop,
      right: targetRight,
      bottom: targetBottom,
      left: targetLeft,
      width: targetWidth,
      height: targetHeight,
      w: windowWidth,
      h: windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      initialTop,
      initialLeft,
    } = this.state

    if (isOpen) {
      return (
        <div>
          {
            !isClosing &&
            <div
              ref={c => (this.mask = c)}
              onClick={this.maskClickHandler}
              className={cn(CN.mask.base, {
                [CN.mask.isOpen]: isOpen,
              })}
            >
              <SvgMask
                windowWidth={windowWidth}
                windowHeight={windowHeight}
                targetWidth={targetWidth}
                targetHeight={targetHeight}
                targetTop={targetTop}
                targetLeft={targetLeft}
                padding={maskSpace}
                rounded={rounded}
                className={maskClassName}
                disableInteraction={
                  disableInteraction && steps[current].stepInteraction
                    ? !steps[current].stepInteraction
                    : disableInteraction
                }
                disableInteractionClassName={`${
                  CN.mask.disableInteraction
                  } ${highlightedMaskClassName}`}
                containerId={containerId}
                onDisableInteractionMouseOver={this.hide}
              />
            </div>
          }
          <Guide
            ref={this.helper}
            targetHeight={targetHeight}
            targetWidth={targetWidth}
            targetTop={targetTop}
            targetRight={targetRight}
            targetBottom={targetBottom}
            targetLeft={targetLeft}
            windowWidth={windowWidth}
            windowHeight={windowHeight}
            helperWidth={helperWidth}
            helperHeight={helperHeight}
            helperPosition={helperPosition}
            padding={maskSpace}
            tabIndex={-1}
            current={current}
            style={steps[current].style ? steps[current].style : {}}
            rounded={rounded}
            className={cn(CN.helper.base, className, {
              [CN.helper.isOpen]: isOpen,
            })}
            accentColor={accentColor}
            initialTop={initialTop}
            initialLeft={initialLeft}
          >
            {steps[current] &&
              (typeof steps[current].content === 'function'
                ? steps[current].content({
                    close: this.hide,
                    goTo: this.gotoStep,
                    inDOM,
                    step: current + 1,
                  })
                : steps[current].content)}
            {showNumber && (
              <Badge data-tour-elem="badge">
                {typeof badgeContent === 'function'
                  ? badgeContent(current + 1, steps.length)
                  : current + 1}
              </Badge>
            )}
            {(showButtons || showNavigation) && (
              <Controls data-tour-elem="controls">
                {showButtons && (
                  <Arrow
                    onClick={
                      typeof prevStep === 'function' ? prevStep : this.prevStep
                    }
                    disabled={current === 0}
                    label={prevButton ? prevButton : null}
                  />
                )}

                {showNavigation && (
                  <Navigation data-tour-elem="navigation">
                    {steps.map((s, i) => (
                      <Dot
                        key={`${s.selector ? s.selector : 'undef'}_${i}`}
                        onClick={() => this.gotoStep(i)}
                        current={current}
                        index={i}
                        disabled={current === i || disableDotsNavigation}
                        showNumber={showNavigationNumber}
                        data-tour-elem="dot"
                      />
                    ))}
                  </Navigation>
                )}

                {showButtons && (
                  <Arrow
                    onClick={
                      current === steps.length - 1
                        ? lastStepNextButton
                          ? this.hide
                          : () => {}
                        : typeof nextStep === 'function'
                        ? nextStep
                        : this.nextStep
                    }
                    disabled={
                      !lastStepNextButton && current === steps.length - 1
                    }
                    inverted
                    label={
                      lastStepNextButton && current === steps.length - 1
                        ? lastStepNextButton
                        : nextButton
                        ? nextButton
                        : null
                    }
                  />
                )}
              </Controls>
            )}

            {showCloseButton ? <Close onClick={this.hide} /> : null}
          </Guide>
          {this.props.children}
        </div>
      )
    }

    return <div />
  }
}

const CN = {
  mask: {
    base: 'reactour__mask',
    isOpen: 'reactour__mask--is-open',
    disableInteraction: 'reactour__mask--disable-interaction',
  },
  helper: {
    base: 'reactour__helper',
    isOpen: 'reactour__helper--is-open',
  },
}

const setNodeState = (node, helper, position) => {
  const w = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  )
  const h = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  )
  const { width: helperWidth, height: helperHeight } = hx.getNodeRect(helper)
  const attrs = node
    ? hx.getNodeRect(node)
    : {
        top: h + 10,
        right: w / 2 + 9,
        bottom: h / 2 + 9,
        left: w / 2 - helperWidth / 2,
        width: 0,
        height: 0,
        w,
        h,
        helperPosition: 'center',
        test: true,
      }

  console.log('ATTRS: ', attrs)
  return function update() {
    return {
      w,
      h,
      helperWidth,
      helperHeight,
      helperPosition: position,
      ...attrs,
      inDOM: node ? true : false,
    }
  }
}

export default TourPortal
