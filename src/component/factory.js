/**
 * TroopJS core/component/factory
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:true*/
define([ "troopjs-utils/unique", "poly/object" ], function ComponentFactoryModule(unique) {
	/*jshint laxbreak:true */

	var ARRAY_PROTO = Array.prototype;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var ARRAY_UNSHIFT = ARRAY_PROTO.unshift;
	var TYPEOF_FUNCTION = typeof function () {};
	var PROTOTYPE = "prototype";
	var LENGTH = "length";
	var EXTEND = "extend";
	var CONSTRUCTOR = "constructor";
	var CONSTRUCTORS = "constructors";
	var SPECIALS = "specials";
	var GROUP = "group";
	var VALUE = "value";
	var FEATURES = "features";
	var TYPE = "type";
	var NAME = "name";
	var RE_SPECIAL = /^(\w+)(?::([^\/]+))?\/(.+)/;

	/**
	 * Extends a component
	 * @returns {*} New component
	 */
	function extend() {
		var args = [this];
		ARRAY_PUSH.apply(args, arguments);
		return Factory.apply(null, args);
	}

	/**
	 * Creates components
	 * @returns {*} New component
	 * @constructor
	 */
	function Factory () {
		var special;
		var specials = [];
		var specialsLength;
		var arg;
		var args = arguments;
		var argsLength = args[LENGTH];
		var constructors = [];
		var constructorsLength;
		var name;
		var names;
		var namesLength;
		var i;
		var j;
		var group;
		var type;
		var matches;
		var prototype = {};
		var descriptor = {};

		// Iterate arguments
		for (i = 0; i < argsLength; i++) {
			// Get arg
			arg = args[i];

			// If this is a function we're going to add it as a constructor candidate
			if(typeof arg === TYPEOF_FUNCTION) {
				// If this is a synthetic constructor then add (child) constructors
				if (CONSTRUCTORS in arg) {
					ARRAY_PUSH.apply(constructors, arg[CONSTRUCTORS]);
				}
				// Otherwise add as usual
				else {
					ARRAY_PUSH.call(constructors, arg);
				}

				// If we have SPECIALS then unshift arg[SPECIALS] onto specials
				if (SPECIALS in arg) {
					ARRAY_UNSHIFT.apply(specials, arg[SPECIALS]);
				}

				// Continue if this is a dead cause
				if (arg === arg[PROTOTYPE][CONSTRUCTOR]) {
					continue;
				}

				// Arg is now arg prototype
				arg = arg[PROTOTYPE];
			}

			// Get arg names
			names = Object.getOwnPropertyNames(arg);

			// Iterate names
			for (j = 0, namesLength = names[LENGTH]; j < namesLength; j++) {
				// Get name
				name = names[j];

				// Check if this matches a SPECIAL signature
				if ((matches = RE_SPECIAL.exec(name))) {
					// Create special
					special = {};

					// Set special properties
					special[GROUP] = group = matches[1];
					special[FEATURES] = matches[2];
					special[TYPE] = type = matches[3];
					special[NAME] = group + "/" + type;
					special[VALUE] = arg[name];

					// Unshift special onto specials
					ARRAY_UNSHIFT.call(specials, special);
				}
				// Otherwise just add to descriptor
				else {
					descriptor[name] = Object.getOwnPropertyDescriptor(arg, name);
				}
			}
		}

		// Define properties on prototype
		Object.defineProperties(prototype, descriptor);

		// Reduce constructors to unique values
		constructorsLength = unique.call(constructors);

		// Reduce specials to unique values
		specialsLength = unique.call(specials);

		// Iterate specials
		for (i = 0; i < specialsLength; i++) {
			// Get special
			special = specials[i];

			// Get special properties
			group = special[GROUP];
			type = special[TYPE];
			name = special[NAME];

			// Get or create group object
			group = group in specials
				? specials[group]
				: specials[group] = [];

			// Get or create type object
			type = type in group
				? group[type]
				: group[type] = specials[name] = [];

			// Store special in group/type
			group[group[LENGTH]] = type[type[LENGTH]] = special;
		}

		/**
		 * Component constructor
		 * @returns {Constructor} Constructor
		 * @constructor
		 */
		function Constructor () {
			// Allow to be created either via 'new' or direct invocation
			var instance = this instanceof Constructor
				? this
				: Object.create(prototype);

			var _args = arguments;
			var _i;

			// Set the constructor on instance
			Object.defineProperty(instance, CONSTRUCTOR, {
				"value" : Constructor
			});

			// Iterate constructors
			for (_i = 0; _i < constructorsLength; _i++) {
				// Capture result as _args to pass to next constructor
				_args = constructors[_i].apply(instance, _args) || _args;
			}

			return instance;
		}

		// Reset descriptor
		descriptor = {};

		// Add PROTOTYPE to descriptor
		descriptor[PROTOTYPE] = {
			"value" : prototype
		};

		// Add CONSTRUCTORS to descriptor
		descriptor[CONSTRUCTORS] = {
			"value" : constructors
		};

		// Add SPECIALS to descriptor
		descriptor[SPECIALS] = {
			"value" : specials
		};

		// Add EXTEND to descriptor
		descriptor[EXTEND] = {
			"value" : extend
		};

		// Add descriptor to Constructor
		Object.defineProperties(Constructor, descriptor);

		// Return Constructor
		return Constructor;
	}

	return Factory;
});