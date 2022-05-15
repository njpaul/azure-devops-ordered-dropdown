# Developing Azure DevOps Ordered Dropdown
## Prerequisites
* [Node.js](https://nodejs.org/en/) 16.14+
* npm (included with Node.js)

## Installing dependencies
After cloning the repository, run the following command to install the dependencies from the `package-lock.json` file.
```
npm ci
```
You only need to do this once, unless you change `package.json` or need to upgrade a dependency.

## Building
After installing the dependencies, you can build the extension with:
```
> npm run build
```

See the `scripts` in `package.json` for other scripts you can run.
Those scripts are useful during development.

## Useful links
* https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=azure-devops
* https://developer.microsoft.com/en-us/azure-devops/develop/extensions
