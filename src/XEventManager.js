const keyMapper = require('./KeyMapper')
module.exports = class XEventManager {
  constructor (wid, XDisplayClient) {
    this.X = XDisplayClient;
    this.wid = wid;

   	const min = this.X.display.min_keycode;
  	const  max = this.X.display.max_keycode;
  	this.X.GetKeyboardMapping(min, max - min, (_, list) => {
  		keyMapper.createMapper(list, min, (_, mapper) => {
  			this.keyMapper = mapper;
  		});
  	});

  	this.X.GetGeometry(wid, (_, result) => {
  		this.width = result.width;
  		this.height = result.height;
  	});
  }
  move (xPercent, yPercent) {
    console.log(this.width, this.height);
   	const x = Math.round(this.width * (xPercent/100));
  	const y = Math.round(this.height * (yPercent/100));
  	return Promise.resolve(this.X.WarpPointer(0,this.wid,0,0,0,0,x,y));
  }
  moveRelative (x, y) {
    return new Promise((resolve) => {
    	this.X.QueryPointer(this.wid, (_, res) => {
    		const newX = res.childX + Math.round(x);
    		const newY = res.childY + Math.round(y);
    		this.X.WarpPointer(0,this.wid,0,0,0,0,newX,newY);
        resolve();
    	});
    })
  }
  keyUp (keyCode) {
    return new Promise((resolve) => {
    	this.X.require('xtest', (_, test) => {
    		test.FakeInput(test.KeyRelease, this.keyMapper.mapKey(keyCode), 0, root, 0, 0);
      });
    });
  }
  keyDown (keyCode) {
    return new Promise((resolve) => {
    	this.X.require('xtest', (_, test) => {
  			test.FakeInput(test.KeyPress, this.keyMapper.mapKey(keyCode), 0, root, 0,0);
        resolve();
    	});
    });
  }
  click (clickCode = 1) {
    return new Promise((resolve) => {
    	this.X.require('xtest', (_, test) => {
    		test.FakeInput(test.ButtonPress, clickCode, 0, root, 0,0);
    		test.FakeInput(test.ButtonRelease, clickCode, 0, root, 0,0);
        resolve();
    	});
    });
  }
  mouseDown(clickCode = 1) {
    return new Promise((resolve) => {
    	this.X.require('xtest', (_, test) => {
    		test.FakeInput(test.ButtonPress, clickCode, 0, root, 0,0);
        resolve();
    	});
    });
  }
  mouseUp(clickCode = 1) {
    return new Promise((resolve) => {
    	this.X.require('xtest', (_, test) => {
    		test.FakeInput(test.ButtonRelease, clickCode, 0, root, 0,0);
        resolve();
    	});
    });
  }
}
