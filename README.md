<h1 align="center">Biobox Slave File Transfer Service</h1>

<p align="center" id="logo">
<a href="https://www.npmjs.com/package/express" target="blank"><img src="https://i.cloudup.com/zfY6lL7eFa-3000x3000.png" width="320" alt="Express Logo" /></a>
</p>

<p align="center">Fast, unopinionated, minimalist web framework for <a href="https://nodejs.org/en/" target="blank">Node.js</a></p>

## Description
A [Node.js](https://nodejs.org/en/) service built using [Express](https://www.npmjs.com/package/express) that runs on Slave

The service runs a cron job (every 2 minutes) that looks for any files in the specified folder which are not under processing and transfers them to Master Box.

## Installation

```bash
$ npm install
```

## Running the app

```bash
$ npm run start
```

## License

Express is [MIT licensed](https://github.com/expressjs/express/blob/HEAD/LICENSE).
