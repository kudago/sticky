//jquery-plugin
if ($){
	$.fn[pluginName] = function (arg) {
		return this.each(function(i,e){
			var $e = $(e);
			var instance = new Sticky($e[0], arg);
			$e.data(pluginName, instance);
		})
	};

	$.Sticky = Sticky;
}