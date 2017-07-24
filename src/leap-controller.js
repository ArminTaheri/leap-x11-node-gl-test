const Jetty = require('jetty');
const { exec } = require('child_process');
const x11 = require('x11');
const XEventManager = require('./XEventManager');
const Leap = require('leapjs');

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

const jetty = new Jetty(process.stdout);
jetty.clear()

function controllerLoop(em) {
  return () => {
    Leap.loop({
      hand: function(hand) {
        jetty.moveTo([0, 0]);
        jetty.text(hand);
      },
    });
  }
}
