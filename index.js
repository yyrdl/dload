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

			if ((null !== mo && undefined !== mo) && undefined === mo.__uid_tag__) {
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
					if (!_has_released[uid_tag]) {
						_has_released[uid_tag] = true;
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
 * return who is the user of target module
 * */
var _find_module_user = function (uid_tag) {
	var users = [];
	for (var p in monitors) {
		var mon = monitors[p];
		for (var q in mon) {
			if (mon[q].__uid_tag__ === uid_tag) {
				users.push(p);
				break;
			}
		}
	}
	return users;
}

/**
 * clear
 * */

var _clear = function (uid_tag) {

	for (var p in monitors) {
		var mon = monitors[p];
		for (var p in mon) {
			if (mon[p].__uid_tag__ === uid_tag) {
				delete mon[p];
			}
		}
	}
}

/**
 * update the module in monitors
 * */

var _update = function (uid_tag, new_mo, except) {
	for (var q in monitors) {
		var mon = monitors[q];
		for (var p in mon) {
			if (mon[p].__uid_tag__ === uid_tag) {
				if (except && except.includes(q)) {}
				else {
					mon[p] = new_mo;
				}
			}
		}
	}

}
/**
 * clear the cache hold by module system recursively ,and return what module was be deleted
 *
 * */
var _clear_cache = function (uid_tag) {

	var old_mo = require.cache[uid_tag];

	var delete_sets = [];

	_delete(uid_tag);

	/**
	 * remove the reference from child module
	 * */
	var children = [];

	for (var i = 0; i < old_mo.children.length; i++) {

		if (old_mo.children[i].parent && old_mo.children[i].parent.filename == uid_tag) {
			children.push(old_mo.children[i].filename);
		}
	}

	for (var i = 0; i < children.length; i++) {

		delete_sets = delete_sets.concat(_clear_cache(children[i]));

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

	delete_sets.push(uid_tag);

	return delete_sets;
}

/**
 * reload target module
 * 一个模块可能不仅在这里会用到，在其他模块中也会用到，如果更新后该模块没有用到，则会导致其他用到的地方
 * 该模块不可用
 * */

var reload = function (file_path) {

	var uid_tag = require.resolve(file_path);

	var delete_sets = _clear_cache(uid_tag);

	require(file_path); // re-require

	var un_reload = [];

	for (var i = 0; i < delete_sets.length; i++) {

		if (require.cache[delete_sets[i]]) {

			_update(delete_sets[i], require.cache[delete_sets[i]].exports);

		} else {

			un_reload.push(delete_sets[i]);

		}
	}
	/**
	 * some modules are not been reloaded ,because the module (file_path) don't use it directly or indirectly anymore .
	 * but some of the modules maybe be used in other place ,we need to check if  it is safe to delete it completely.
	 * */

	for (var i = 0; i < un_reload.length; i++) {

		var users = _find_module_user(un_reload[i]);

		var tag = true;

		for (var j = 0; j < users.length; j++) {

			if (!delete_sets.includes(users[j])) { //imply that the module is also  used in other place

				tag = false;

				break;

			}
		}

		if (!tag) {
           
			require(un_reload[i]);

			_update(un_reload[i], require.cache[un_reload[i]].exports, delete_sets);

		} else {

			_clear(un_reload[i]);

		}
	}
};

exports.new = new_monitor;
exports.reload = reload;
