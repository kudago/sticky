module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		homemade: {
			main:{
				src: "build.js",
				dest: "<%= pkg.name %>.js",
				context: {
					pluginName: "sticky",
					className: "sticky",
					DEV: false
				}
			}
		},

		jshint: {
			// define the files to lint
			files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			// configure JSHint (documented at http://www.jshint.com/docs/)
			options: {
				// more options here if you want to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true
				},
				strict: false
			}
		},

		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['src/utils.js', 'src/sticky.js'],
				dest: '<%= pkg.name %>.js'
			},
		},

		uglify: {
			options: {
				//banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				files: {
					'<%= pkg.name %>.min.js': ['<%= homemade.main.dest %>']
				}
			}
		}
	});

	//load tasks
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-homemade");

	//register tasks
	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['homemade', 'uglify']);

};