/**
 * TroopJS core/component/base
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "../component/factory", "when" ], function ComponentModule(Factory, when) {
	/*jshint laxbreak:true */

	var ARRAY_PROTO = Array.prototype;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var ARRAY_SLICE = ARRAY_PROTO.slice;
	var INSTANCE_COUNT = "instanceCount";
	var VALUE = "value";
	var SIG = "sig";
	var COUNT = 0;

	return Factory(
	/**
	 * Creates a new component
	 * @constructor
	 */
	function Component() {
		// Update instance count
		this[INSTANCE_COUNT] = ++COUNT;
	}, {
		"instanceCount" : COUNT,

		"displayName" : "core/component/base",

		/**
		 * Signals the component
		 * @param _signal {String} Signal
		 * @return {*}
		 */
		"signal" : function onSignal(_signal) {
			var self = this;
			var args = ARRAY_SLICE.call(arguments);
			var specials = self.constructor.specials;
			var signals = (SIG in specials && specials[SIG][_signal]) || [];
			var signal;
			var index = 0;

			function next() {
				// Return a chained promise of next callback, or a promise resolved with _signal
				return (signal = signals[index++])
					? when(signal[VALUE].apply(self, args), next)
					: when.resolve(_signal);
			}

			// Return promise
			return next();
		},

		/**
		 * Start the component
		 * @return {*}
		 */
		"start" : function start() {
			var self = this;
			var signal = self.signal;
			var args = [ "initialize" ];

			// Add signal to arguments
			ARRAY_PUSH.apply(args, arguments);

			return signal.apply(self, args).then(function started() {
				// Modify args to change signal
				args[0] = "start";

				return signal.apply(self, args);
			});
		},

		/**
		 * Stops the component
		 * @return {*}
		 */
		"stop" : function stop() {
			var self = this;
			var signal = self.signal;
			var args = [ "stop" ];

			// Add signal to arguments
			ARRAY_PUSH.apply(args, arguments);

			return signal.apply(self, args).then(function stopped() {
				// Modify args to change signal
				args[0] = "finalize";

				return signal.apply(self, args);
			});
		},

		/**
		 * Generates string representation of this object
		 * @returns {string} displayName and instanceCount
		 */
		"toString" : function _toString() {
			var self = this;

			return self.displayName + "@" + self[INSTANCE_COUNT];
		}
	});
});
