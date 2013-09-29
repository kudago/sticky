module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		homemade: {
			main:{
				src: "./build/build.js",
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

		//used as beautifier
		uglify: {
			options: {
				//banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
				compress: false,
				preserveComments: true,
				mangle: false,
				beautify: true,
			},
			dist: {
				files: {
					'<%= pkg.name %>.js': ['<%= homemade.main.dest %>']
				}
			}
		},

		'closure-compiler': {
			frontend: {
				closurePath: '.',
				js: '<%= pkg.name %>.js',
				jsOutputFile: '<%= pkg.name %>.min.js',
				maxBuffer: 800,
				options: {
					compilation_level: 'ADVANCED_OPTIMIZATIONS',
					language_in: 'ECMASCRIPT5_STRICT',
					//formatting: 'pretty_print'
				}
			}
		}
	});

	//load tasks
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks("grunt-homemade");

	//register tasks
	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['homemade', 'closure-compiler']);

};