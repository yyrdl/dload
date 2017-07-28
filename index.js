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
var _caculate_clear_modules = function (uid_tag) {

	var old_mo = require.cache[uid_tag];

	var delete_sets = [];

	var children = [];

	for (var i = 0; i < old_mo.children.length; i++) {

		if (old_mo.children[i].parent && old_mo.children[i].parent.filename == uid_tag) {
			children.push(old_mo.children[i].filename);
		}
	}

	for (var i = 0; i < children.length; i++) {

		delete_sets = delete_sets.concat(_caculate_clear_modules(children[i]));

	}

	delete_sets.push(uid_tag);

	return delete_sets;
}

var _clear_module_system_cache = function (uid_tag) {

	var old_mo = require.cache[uid_tag];

	if (!old_mo) {
		return null;
	}

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
		_clear_module_system_cache(children[i]);
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

	require.cache[uid_tag] = null;

	delete require.cache[uid_tag];

	return null;
}

/**
 * reload target module
 * 感觉又回到了C++时代，小心地处理内存。。
 * */

var reload = function (file_path) {

	var uid_tag = require.resolve(file_path);

	if(!uid_tag){
		return null;
	}

	var delete_sets = _caculate_clear_modules(uid_tag);

	var temp_exports = {};

	for (var i = 0; i < delete_sets.length; i++) {
		/**
		 * there exists runtime-status in some modules ,such as an counter. we should keep it temporarily.
		 * */

		temp_exports[delete_sets[i]] = require.cache[delete_sets[i]].exports;

		/**
		 * delete the reference in module system
		 * */
		_clear_module_system_cache(delete_sets[i]);

	}

	/**
	 * re-require
	 * */
	require(file_path);

	var un_reload = [];

	for (var i = 0; i < delete_sets.length; i++) {

		if (require.cache[delete_sets[i]]) {


            delete temp_exports[delete_sets[i]];

			_delete(delete_sets[i]);

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

		if (!tag) { //the module also be used in other place

			require(un_reload[i]); //re-require it

			/**
			 * recovery from temp
			 * 从保存的缓存恢复，保存原模块的缓存是由于模块本身可能有状态，而重新加载会重新刷新状态，所以需要从缓存恢复
			 *
			 * */
			if (temp_exports[un_reload[i]]) {

				var exp = require.cache[un_reload[i]].exports;


				if ("function" === typeof exp._release) {

					exp._release();

				}

				require.cache[un_reload[i]].exports = temp_exports[un_reload[i]];

				delete temp_exports[un_reload[i]];

			}

			_update(un_reload[i], require.cache[un_reload[i]].exports, delete_sets);

		} else {

			delete temp_exports[un_reload[i]];

			delete monitors[un_reload[i]];

			_delete(un_reload[i]);

			_clear(un_reload[i]);

		}
	}

};


exports.new = new_monitor;
exports.reload = reload;
