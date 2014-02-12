/*globals buster:false*/
buster.testCase("troopjs-core/component/gadget", function (run) {
	"use strict";

	var assert = buster.referee.assert;

	var ARRAY_PROTO = Array.prototype;
	var ARRAY_CONCAT = ARRAY_PROTO.concat;
	var TOPIC = "TEST";
	var TEST_ARGS = ["abc", "", 1, 0, false, true, {}];
	var APPLY_ARGS = ARRAY_CONCAT.call(ARRAY_PROTO, [TOPIC], TEST_ARGS);
	var EMPTY = "";
	var NAME_HANDLER = "__test_handlers";

	/**
	 * compare a array of expected result with actual result
	 */
	function allSame(actual, expected){
		for(var l = expected.length; l--;){
			assert.same(expected[l], actual[l]);
		}
	}

	require( [ "troopjs-core/component/gadget", "when" ] , function (Gadget, when) {

		run({
			"publish/subscribe": {
				setUp: function(){
					var me = this;

					var insts = me.instances = [];

					me.registerInstance = function(instance){
						var found = false;

						for(var l = insts.length; l--;){
							var inst = insts[l];

							if (inst === instance){
								found = true;
								break;
							}
						}

						if (found){
							return;
						}

						me.instances.push(instance);
					};

					// helper to subscribe topic,
					// all subscription will be cleaned in teardown
					me.subscribe = function(context, topic, func){
						if (!context[NAME_HANDLER]){
							context[NAME_HANDLER] = [];
						}

						me.registerInstance(context);

						// call the real subscribe
						context.subscribe(topic, func);

						context[NAME_HANDLER].push({
							topic: topic,
							func: func
						});

						return me;

					};
				},
				tearDown: function(){
					var me = this;
					var insts = me.instances;

					// clear up all subscription
					for(var l = insts.length; l--;){

						var inst = insts[l];

						if (!inst[NAME_HANDLER]){
							continue;
						}

						var handlers = inst[NAME_HANDLER];

						for(var m = handlers.length; m--;){
							var handler = handlers[m];

							inst.unsubscribe(handler.topic, handler.func);
						}

						// pop out instance at last
						insts.pop();

					}
				},
				// POSITIVE TESTS
				"without exception" : function () {
					var g1 = new Gadget();

					this.subscribe(g1, TOPIC, function(test){
						assert(test);
					});

					g1
					.publish(TOPIC, true);
				},
				"without exception when there is no subscriber" : function () {
					var g1 = new Gadget();

					g1
					.publish(TOPIC);
					assert(true);
				},
				"subscribe empty topic": function(){
					var g1 = new Gadget();

					this.subscribe(g1, EMPTY, function(test){
						assert(test);
					});

					g1.publish(EMPTY, true);
				},
				"different topics should not interfere with each other": function(){
					var g1 = new Gadget();

					this
					.subscribe(g1, TOPIC + "diff", function(){
						assert(false);
					})
					.subscribe(g1, TOPIC, function(test){
						assert(test);
					});

					g1.publish(TOPIC, true);
				},
				"with args" : function () {
					var g1 = new Gadget();

					this
					.subscribe(g1, TOPIC, function(){
						allSame(arguments, TEST_ARGS);
					});

					g1
					.publish.apply(g1, APPLY_ARGS);
				},
				"multiple times and in order" : function () {
					var g1 = new Gadget();

					var spy = this.spy();

					this
					.subscribe(g1, TOPIC, spy)
					.subscribe(g1, TOPIC, function(){

						assert.called(spy);

						allSame(arguments, TEST_ARGS);
					});

					g1
					.publish.apply(g1, APPLY_ARGS);
					return when(1);
				},
				"cross gadget" : function () {

					var g1 = new Gadget();
					var g2 = new Gadget();

					this.subscribe(g1, TOPIC, function(){
						allSame(arguments, TEST_ARGS);
					});

					g2.publish.apply(g2, APPLY_ARGS);
				}
			},
			"on/off/emit": {
				"emit to a topic that no handler is listening": function(){
					var g1 = new Gadget();

					g1.emit.apply(g1, TEST_ARGS);
					assert(true);
				},
				"without exception": function(){
					var g1 = new Gadget();

					g1.on(TOPIC, function(){
						allSame(arguments, TEST_ARGS);
					});

					g1.emit.apply(g1, APPLY_ARGS);
				},
				"on multiple instance should not interfere with each other": function(){
					var g1 = new Gadget();
					var g2 = new Gadget();

					g1.on(TOPIC, function(){
						allSame(arguments, TEST_ARGS);
					});
					g2.on(TOPIC, function(){
						assert(false);
					});

					g1.emit.apply(g1, APPLY_ARGS);
					return when(1);
				},
				"on() multiple times and the handler received in order": function(){
					var g1 = new Gadget();
					var g2 = new Gadget();

					var spy = this.spy();

					g1.on(TOPIC, spy);
					g1.on(TOPIC, function(test){
						assert.called(spy);
						allSame(arguments, TEST_ARGS);
					});
					g2.on(TOPIC, function(){
						assert(false);
					});

					g1.emit.apply(g1, APPLY_ARGS);
					return when(1);
				}
			},

			"publish/subscribe - context matches *this* ": function (done) {

				var count = 0;
				var g1 = Gadget.create({
					'hub/foo': function () {
						count++;
						assert.same(g1, this);
					}
				});

				var g2 = Gadget.create({
					'hub/foo': function () {
						count++;
						assert.same(g2, this);
					}
				});

				var g3 = Gadget.create({});

				g1.start().then(function () {
					g2.start().then(function () {
						g3.publish('foo').then(function () {
							assert.same(2, count);
							done();
						});
					})
				});
			},

			"publish/subscribe - memory" : function() {
				var spy = this.spy();
				var g1 = Gadget.create({
					"hub:memory/foo/bar": function() {
						spy.apply(spy,arguments);
					}
				});

				return g1.publish("foo/bar", "foo", "bar").then(function() {
					return g1.start().then(function() {
						assert.calledOnce(spy);
						assert.calledWithExactly(spy, "foo", "bar");
					});
				});
			}
		});
	});
});
