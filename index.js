/**
 * Created by jason on 2017/7/27. license MIT
 */
var slice = [].slice;

/**
 * convert some primary value to corresponding Object
 * */
var _convert = function (mo) {
	if ("number" === typeof mo && 　!(mo instanceof Number)) {
		return new Number(mo);
	}
	if ("string" === typeof mo && !(mo instanceof String)) {
		return new String(mo);
	}
	if ("boolean" === typeof mo && !(mo instanceof Boolean)) {
		return new Boolean(mo);
	}
	return mo;
}

var module = require("module");
/**
 * add hook to module system
 * */
if (!module.__registed__) {

	var load = module._load;

	module._load = function () {
		var args = slice.call(arguments);
		var filename = module._resolveFilename.apply(module, args);
		var mo = load.apply(module, args);
		if (undefined !== mo && 　null !== mo) {
			/**
			 * convert some primary value to corresponding Object
			 * */
			mo = _convert(mo);

			if ((null !== mo && undefined !== mo ) && undefined === mo.__uid_tag__) {
				/**
				 * add an identity to the module
				 * */
				mo.__uid_tag__ = filename;
				Object.defineProperty(mo, "__uid_tag__", {
					enumerable: false,
					writable: false
				});
			}
		}
		return mo;
	}

	module.__registed__ = true;

}

var monitors = {};
/**
 * create a monitor for modules
 * */
var new_monitor = function () {

	var caller_file = new_monitor.caller.arguments[3];

	monitors[caller_file] = null;

	var mon = {};

	monitors[caller_file] = mon;

	return mon;
}

/**
 * delete the old module from monitors
 * */

var _delete = function (uid_tag) {
	var _has_released = {};
	for (var p in monitors) {
		var mon = monitors[p];
		for (var p in mon) {
			if (mon[p].__uid_tag__ === uid_tag) {
				/**
				 * for some modules which need to release resource manually
				 * */
				if ("function" === typeof mon[p]._release) {
					if(!_has_released[uid_tag]){
						_has_released[uid_tag]=true;
						mon[p]._release();
					}
				}
				/**
				 * delete the reference
				 * */
				mon[p] = null;
				mon[p] = {
					"__uid_tag__": uid_tag
				};
			}
		}
	}
}

/**
 * update the module in monitors
 * */

var _update = function (uid_tag, new_mo) {
	for (var p in monitors) {
		var mon = monitors[p];
		for (var p in mon) {
			if (mon[p].__uid_tag__ === uid_tag) {
				mon[p] = new_mo;
			}
		}
	}

}
/**
 * clear the cache hold by module system
 *
 * */
var _clear_cache = function (uid_tag) {

	var old_mo = require.cache[uid_tag];
	/**
	 * remove the reference from child module
	 * */
	for (var i = 0; i < old_mo.children.length; i++) {
		if (old_mo.children[i].parent && old_mo.children[i].parent.filename == uid_tag) {
			_clear_cache(old_mo.children[i].filename);
		}
	}

	/**
	 * remove the reference from parent module
	 * */
	if (old_mo.parent) {
		var parent_mo = old_mo.parent;

		var children = [];

		for (var i = 0; i < parent_mo.children.length; i++) {
			if (parent_mo.children[i].filename !== uid_tag) {
				children.push(parent_mo.children[i]);
			} else {
				parent_mo.children[i] = null;
			}
		}
		parent_mo.children = children;
	}

	old_mo = null;

	delete require.cache[uid_tag];

}

/**
 * reload target module
 * */

var reload = function (file_path) {

	var uid_tag = require.resolve(file_path);

	_delete(uid_tag);

	_clear_cache(uid_tag);

	_update(uid_tag, require(file_path));

};

exports.new = new_monitor;
exports.reload = reload;
