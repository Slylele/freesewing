/* eslint-disable no-console */
const path = require("path");
const fse = require("fs-extra");
const glob = require("glob");
const yaml = require("js-yaml");
const chalk = require("chalk");
const Mustache = require("mustache");
const { version } = require("../lerna.json");

const repoPath = process.cwd();
const config = {
  repoPath,
  defaults: readConfigFile("defaults.yaml"),
  descriptions: readConfigFile("descriptions.yaml"),
  keywords: readConfigFile("keywords.yaml"),
  badges: readConfigFile("badges.yaml"),
  scripts: readConfigFile("scripts.yaml"),
  dependencies: readConfigFile("dependencies.yaml", { version }),
  exceptions: readConfigFile("exceptions.yaml"),
  templates: {
    pkg: readTemplateFile("package.dflt.json"),
    rollup: readTemplateFile("rollup.config.dflt.js"),
    readme: readTemplateFile("readme.dflt.md")
  }
};
const packages = glob.sync("*", {
  cwd: path.join(config.repoPath, "packages")
});

validate(packages, config);
reconfigure(packages, config);

process.exit();

/**
 * Reads a template file, with Mustache replacements if needed
 */
function readTemplateFile(file, replace = false) {
  return fse.readFileSync(
    path.join(repoPath, "config", "templates", file),
    "utf-8"
  );
}

/**
 * Reads a YAML config file, with Mustache replacements if needed
 */
function readConfigFile(file, replace = false) {
  if (replace)
    return yaml.safeLoad(
      Mustache.render(
        fse.readFileSync(path.join(repoPath, "config", file), "utf-8"),
        replace
      )
    );
  return yaml.safeLoad(
    fse.readFileSync(path.join(repoPath, "config", file), "utf-8")
  );
}

/**
 * Reads info.md from the package directory
 * Returns its contents if it exists, or an empty string if not
 */
function readInfoFile(pkg) {
  let markup = "";
  try {
    markup = fse.readFileSync(
      path.join(repoPath, "packages", pkg, "info.md"),
      "utf-8"
    );
  } catch {
    return "";
  }

  return markup;
}

/**
 * Figure out what sort of package this is.
 * Returns a string, one of:
 *  - pattern
 *  - plugin
 *  - other
 */
function packageType(pkg, config) {
  if (pkg.substring(0, 7) === "plugin-") return "plugin";
  if (config.descriptions[pkg].substring(0, 21) === "A FreeSewing pattern ")
    return "pattern";
  return "other";
}

/**
 * Returns an array of keywords for a package
 */
function keywords(pkg, config, type) {
  if (typeof config.keywords[pkg] !== "undefined") return config.keywords[pkg];
  if (typeof config.keywords[type] !== "undefined")
    return config.keywords[type];
  else {
    console.log(
      chalk.redBright.bold("Problem:"),
      chalk.redBright(`No keywords for package ${pkg} which is of type ${type}`)
    );
    process.exit();
  }
}

/**
 * Returns an plain object of scripts for a package
 */
function scripts(pkg, config, type) {
  let runScripts = {};
  for (let key of Object.keys(config.scripts._)) {
    runScripts[key] = Mustache.render(config.scripts._[key], {
      name: pkg
    });
  }
  if (typeof config.scripts._types[type] !== "undefined") {
    for (let key of Object.keys(config.scripts._types[type])) {
      runScripts[key] = Mustache.render(config.scripts._types[type][key], {
        name: pkg
      });
    }
  }
  if (typeof config.scripts[pkg] !== "undefined") {
    for (let key of Object.keys(config.scripts[pkg])) {
      runScripts[key] = Mustache.render(config.scripts[pkg][key], {
        name: pkg
      });
    }
  }

  return runScripts;
}

/**
 * Returns an plain object with the of dependencies for a package
 * section is the key in teh dependencies.yaml fine, one of:
 *
 *  - _ (for dependencies)
 *  - dev (for devDependencies)
 *  - peer (for peerDependencies)
 *
 */
function deps(section, pkg, config, type) {
  let dependencies = {};
  if (
    typeof config.dependencies._types[type] !== "undefined" &&
    typeof config.dependencies._types[type][section] !== "undefined"
  )
    dependencies = config.dependencies._types[type][section];
  if (typeof config.dependencies[pkg] === "undefined") return dependencies;
  if (typeof config.dependencies[pkg][section] !== "undefined")
    return { ...dependencies, ...config.dependencies[pkg][section] };
}

/**
 * These merely call deps() for the relevant dependency section
 */
function dependencies(pkg, config, type) {
  return deps("_", pkg, config, type);
}
function devDependencies(pkg, config, type) {
  return deps("dev", pkg, config, type);
}
function peerDependencies(pkg, config, type) {
  return deps("peer", pkg, config, type);
}

/**
 * Creates a package.json file for a package
 */
function packageConfig(pkg, config) {
  let type = packageType(pkg, config);
  let pkgConf = {};
  // Let's keep these at the top
  pkgConf.name = fullName(pkg, config);
  pkgConf.version = version;
  (pkgConf.description = config.descriptions[pkg]),
    (pkgConf = {
      ...pkgConf,
      ...JSON.parse(Mustache.render(config.templates.pkg, { name: pkg }))
    });
  pkgConf.keywords = pkgConf.keywords.concat(keywords(pkg, config, type));
  (pkgConf.scripts = scripts(pkg, config, type)),
    (pkgConf.dependencies = dependencies(pkg, config, type));
  pkgConf.devDependencies = devDependencies(pkg, config, type);
  pkgConf.peerDependencies = peerDependencies(pkg, config, type);
  if (typeof config.exceptions.packageJson[pkg] !== "undefined") {
    pkgConf = {
      ...pkgConf,
      ...config.exceptions.packageJson[pkg]
    };
  }

  return pkgConf;
}

/**
 * Returns an string with the markup for badges in the readme file
 */
function badges(pkg, config) {
  let markup = "";
  for (let group of ["_all", "_social"]) {
    markup += "<p align='center'>";
    for (let key of Object.keys(config.badges[group])) {
      markup += formatBadge(
        config.badges[group][key],
        pkg,
        fullName(pkg, config)
      );
    }
    markup += "</p>";
  }

  return markup;
}

/**
 * Formats a badge for a readme file
 */
function formatBadge(badge, name, fullname) {
  return `<a
  href="${Mustache.render(badge.link, { name, fullname })}"
  title="${Mustache.render(badge.alt, { name, fullname })}"
  ><img src="${Mustache.render(badge.img, { name, fullname })}"
  alt="${Mustache.render(badge.alt, { name, fullname })}"/>
  </a>`;
}
/**
 * Returns the full (namespaced) name of a package
 */
function fullName(pkg, config) {
  if (config.exceptions.noNamespace.indexOf(pkg) !== -1) return pkg;
  else return `@freesewing/${pkg}`;
}

/**
 * Creates a README.md file for a package
 */
function readme(pkg, config) {
  let markup = Mustache.render(config.templates.readme, {
    fullname: fullName(pkg, config),
    description: config.descriptions[pkg],
    badges: badges(pkg, config),
    info: readInfoFile(pkg)
  });

  return markup;
}

/**
 * Make sure we have (at least) a description for each package
 */
function validate(pkgs, config) {
  console.log(chalk.blueBright("Validating package descriptions"));
  for (let pkg of pkgs) {
    if (typeof config.descriptions[pkg] !== "string") {
      console.log(
        chalk.redBright.bold("Problem:"),
        chalk.redBright(`No description for package ${pkg}`)
      );
      process.exit();
    }
  }
  console.log(chalk.yellowBright.bold("Looks good"));

  return true;
}

/**
 * Puts a package.json, rollup.config.js, and README.md
 * into every subdirectory under the packages directory.
 */
function reconfigure(pkgs, config) {
  for (let pkg of pkgs) {
    console.log(chalk.blueBright(`Reconfiguring ${pkg}`));
    fse.writeFileSync(
      path.join(config.repoPath, "packages", pkg, "package.json"),
      JSON.stringify(packageConfig(pkg, config), null, 2) + "\n"
    );
    if (config.exceptions.customRollup.indexOf(pkg) === -1) {
      fse.writeFileSync(
        path.join(config.repoPath, "packages", pkg, "rollup.config.js"),
        config.templates.rollup
      );
    }
    fse.writeFileSync(
      path.join(config.repoPath, "packages", pkg, "README.md"),
      readme(pkg, config)
    );
  }
  console.log(
    chalk.yellowBright.bold("All done."),
    chalk.yellowBright("Run"),
    chalk.white.bold("lerna bootstrap"),
    chalk.yellowBright("to load new dependencies.")
  );
}