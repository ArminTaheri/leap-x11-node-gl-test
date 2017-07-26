const { exec } = require('child_process');
const x11 = require('x11');
const XEventManager = require('./XEventManager');
const Leap = require('leapjs');

// Function programming libraries
const R = require('ramda');
const M = require('ramda-fantasy').Maybe;
const IO = require('ramda-fantasy').IO;

x11.createClient((err, display) => {
  const X = display.client;
  exec("xwininfo | grep 'xwininfo: Window id:' | awk '{print $4}'", (err, stdout) => {
    if (err) {
      throw err;
    }
    const wid = Number(stdout.trim());
    const em = new XEventManager(wid, X);
    X.SetInputFocus(wid);
    setTimeout(controllerLoop(em), 300);
  });
});

const Jetty = require('jetty');
const jetty = new Jetty(process.stdout);

function log(string) {
  jetty.clear()
  jetty.moveTo([0, 0]);
  jetty.text(string);
}

const present = require('present');
let last = present();
function delt() {
  out = String(present() - last);
  last = present();
  return out;
}



function controllerLoop(em) {
  return () => {
    // Executes a function inside an IO context.
    const runIO = R.invoker(0, 'runIO');

    // PINCH_THRESHOLD: Number
    const PINCH_THRESHOLD = 0.93;

    // SCREEN_TO_HANDS_SCALE: Number
    const SCREEN_TO_HANDS_SCALE = 10;

    // getHand: String -> Frame -> Hand
    const getHand = hand => R.pipe(
      R.prop('hands'),
      R.filter(R.propEq('type', hand)),
      R.ifElse(R.isEmpty, M.Nothing, R.compose(M.Just, R.head))
    );

    // leftHand: Frame -> Hand
    const leftHand = getHand('left');

    // rightHand: Frame -> Hand
    const rightHand = getHand('right');

    // displacementSince: Frame -> Hand -> Leap.Vec3
    const displacementSince = R.invoker(1, 'translation');

    // pinchedDisplacement = Frame -> Hand -> Maybe Leap.Vec3
    const pinchedDisplacement = lastFrame => R.ifElse(
      R.propSatisfies(R.gte(R.__, PINCH_THRESHOLD), 'pinchStrength'),
      R.compose(M.Just, displacementSince(lastFrame)),
      M.Nothing
    );

    // toMouseMove: Leap.Vec3 -> [Number]
    const toMouseMove = R.pipe(
      R.map(R.multiply(SCREEN_TO_HANDS_SCALE)),
      v => [v[0], -v[1]] // Get X and -Y displacement;
    );

    // doMouseMove: [Number] -> IO ();
    const doMouseMove = v => IO(() => em.moveRelative(...v));

    let lastFrame;
    Leap.loop({
      frame: function (frame) {
        if (!lastFrame) {
          lastFrame = frame;
          return;
        }

        // left: Hand
        const left = leftHand(frame);

        // right: Hand
        const right = rightHand(frame);

        // rightPinch: Maybe Leap.Vec3
        const rightPinch = R.chain(pinchedDisplacement(lastFrame), right);

        /* take the maybe-detected right hand to a possible
         * displacement if pinching, convert to mouse displacement
         * and send the mouse displacement to X server.
         */
        const mouseAction = R.map(R.compose(runIO, doMouseMove, toMouseMove), rightPinch);
        log(`${rightPinch.toString()} \n time: ${delt()}`);

        lastFrame = frame;
      }
    });
  }
}
