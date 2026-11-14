{
  description = "Ali Umar's portfolio";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.buildNpmPackage {
            pname = "portfolio";
            version = "1.0.0";
            src = ./.;

            npmDepsHash = "sha256-77k0juMCN63NmesCRe7XgyjXpNItjsECBKILw7Oj0UU=";
            npmBuildScript = "build";

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r dist/. $out/
              runHook postInstall
            '';

            meta = {
              description = "Ali Umar's portfolio";
              homepage = "https://aliumar.dev";
            };
          };
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_24 ];
            shellHook = ''
              echo "portfolio dev shell — Node $(node --version)"
              echo "Run: npm ci && npm run dev"
              echo "Tasks: npx roadmapped sitrep · npx roadmapped dashboard"
            '';
          };
        }
      );

      formatter = forAllSystems (
        system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style
      );
    };
}
