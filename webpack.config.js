

"use strict";

import path from "node:path";
import { fileURLToPath } from "node:url";
import TerserPlugin from "terser-webpack-plugin";


/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
    target: "node",
    mode: "production",

    entry: "./src/extension.ts",
    output: {
        // Resolve output path correctly in ESM using fileURLToPath
        path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist"),
        filename: "extension.js",
        libraryTarget: "commonjs2",
    },
    externals: {
        vscode: "commonjs vscode",

    },
    resolve: {
        alias: {
            "@src": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
        },
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: { comments: false },
                },
            }),
        ],

    },
    devtool: "nosources-source-map",
    infrastructureLogging: {
        level: "log",
    },
};

export default [extensionConfig];
