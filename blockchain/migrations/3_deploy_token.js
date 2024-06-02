const Token = artifacts.require("BigFlexToken");

module.exports = function(deployer) {
  deployer.deploy(Token, "BIG_FLEX_TOKEN", "BFT", 1000000, 1, []);
};
