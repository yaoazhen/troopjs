/**
 * TroopJS core/event/config
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
define([ "module", "troopjs-utils/merge" ], function EventConfigModule(module, merge) {
	"use strict";

	/**
	 * @class core.event.config
	 * @singleton
	 */
	return merge.call({

		/**
		 * @cfg {String} runner Name of default runner.
		 */
		"runner": "sequence",

		/**
		 * @cfg {Object} runners Custom runners.
		 */
		"runners" : {}
	}, module.config());
});