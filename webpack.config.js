import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TerserPlugin from 'terser-webpack-plugin';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export default {
	entry: path.join(__dirname, 'src/index.ts'),
	output: {
		path: path.join(__dirname, 'dist/'),
		filename: 'index.js',
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.html$/,
				use: { loader: 'html-loader' },
			},
		],
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				terserOptions: {
					format: {
						comments: false,
					},
				},
			}),
		],
	},
	externals: {
		// SillyTavern modules - resolved at runtime by the extension loader
		// Format: 'import path': 'commonjs runtime path'
		'../../../../scripts/world-info.js': 'commonjs ../../../../scripts/world-info.js',
		'../../../../script.js': 'commonjs ../../../../script.js',
		'../../../../scripts/extensions.js': 'commonjs ../../../../scripts/extensions.js',
		'../../../../scripts/utils.js': 'commonjs ../../../../scripts/utils.js',
	},
};
