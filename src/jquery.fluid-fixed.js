//jquery-plugin
if ($){
	$.fn[pluginName] = function (arg) {
		var $el = $(this),
			instance = new Sticky($el[0], arg);
		$el.data(pluginName, null);
		$el.data(pluginName, instance);
		return instance;
	};

	$.Sticky = Sticky;
}