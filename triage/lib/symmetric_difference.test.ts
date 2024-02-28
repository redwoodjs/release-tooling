import { $ } from 'zx'

import { beforeAll, afterAll, describe, expect, it, test } from 'vitest'

import { assertRwfwPathAndSetCwd } from '@lib/cwd.js'

import { colors } from './colors.js'
import {
  getPrettyLine,
  getSymmetricDifference,
  lineIsAnnotatedTag,
  lineIsChore,
  lineIsGitLogUi,
  PADDING,
  resolveLine,
} from './symmetric_difference.js'

$.verbose = false

describe('getSymmetricDifference', () => {
  let resetCwd: () => void
  beforeAll(async () => {
    resetCwd = await assertRwfwPathAndSetCwd()
  })
  afterAll(() => {
    resetCwd()
  })

  it('works', async () => {
    const symDiff = await getSymmetricDifference({ from: 'release-tooling/main-test', to: 'release-tooling/next-test' })
    expect(symDiff).toMatchInlineSnapshot(`
      [
        "< 9b1dd056d2c33b23a63874f23f4efb5808e0660e Add support for additional env var files (#9961)",
        "< ba6934911a242a6e328571493c263970b42174be Update studio.md (#10062)",
        "< 2a89267b92d11e7b44c5ff2f18d0427ae0476121 chore(rename): Be consistent with 'for' prefix for babel plugin option (#10059)",
        "< 553f4ac7d6bc28bfc93ac59ad6c2746ff5e71ce5 RSC: Remove commented code from worker (#10058)",
        "< d5214c92cde6bfdb14c6c1769250c31b23d56328 fix(render): reduce memory and handle server file  (#10055)",
        "< 1f02ae3cc205cdb2cc98bd6a02a7f264b11cb96b chore(release): update changelog (v7.0.1, v7.0.2)",
        "< 9b6047b0e48762959b7f3d382ee3dd3c9237ef5b RSC: Simplify entriesFile loading (#10057)",
        "< 965b7ea3901a7e82201bea2090eaaec77e37a210 chore(types): Get rid of TS typecast in babel config (#10056)",
        "< 95ba45c24911649fe1e2bcb5df3af6e7276b090a Update MetaTags to be MetaData in Docs (#10053)",
        "< 9ad5c7c4bf5cefad0d05fc3a251ea27d1068e8e9 chore(deps): bump ip from 2.0.0 to 2.0.1 (#10043)",
        "< a3d955886b61c3a05ff7aea27711adbdb8e1f964 chore(deps): bump ip from 1.1.5 to 1.1.9 in /docs (#10047)",
        "< c171208de79866b502a6edcfa8a10b151ed1fcf7 RSC: Transform client components during build (#10048)",
        "< e25b51984037d364dfdaf0b038074dbf7b9532c8 RSC: Upgrade test-project-rsa to v8 canary (#10050)",
        "< 5e8bc3a1268d486bbbb9e796b3822fcc21a8f0cb RSC: Refactor: extract common code for env vars (#10049)",
        "< a59205c826e5e980437a86397d5df8c65c7d5759 RSC: Refactor node-loader and some vite plugins (#10046)",
        "< d012c60f9ba64e023837ceda35f0944923c751e6 chore(deps): acorn-loose 8.4.0 (#10042)",
        "< 1de0d68a8c04fc8fb05988ca11706f15f68c5c6f chore(ci): update yarn.lock for changelog action (#10039)",
        "< 4f612f813f6dd10fe8861c2a5eba21a0011cb1c6 chore: bump TSTyche (#10036)",
        "<   635d6dea677b28993661a2e46659ff8c987b7275 Merge branch 'release/major/v7.0.0'",
        "|\\  ",
        "< | 8b467685a7cdce55f8be6424793bc5e6ad450c0a chore(docs): align v6 docs with the next branch (#10034)",
        "< | 4b5f0243354553d59e744574f09803e3f42a17ba fix(server): prefix port/host with api, fix logging (#10035)",
        "< | cf3c4211cda0b7d7f68b27948055ff4312c125fe docs: Removes warning within Mailer documentation about Studio being experimental (#10033)",
        "< | 369c9e5aa9493ba2806870fadc3f6f16af7e5aa6 docs: Within describeScenario documentation, change optimisation to use American English (#10032)",
        "< | 70602deaafdc3481d791900b6ed5e0970eacf0d7 RSC: No basePath arg to serve() (#10030)",
        "< | 12d3fc18e6948f6b52065fc9bf96e4cbaba8a942 RSC: Add MultiCellPage to test fixture (#10029)",
        "< | e9261ce71687fd6dd579dcc9ea145eda4d039220 RSC chore(tests): Add links to scaffolds in test fixture (#10028)",
        "< | ad9bef80715382abc54f0ef09c441e3925b10f95 docs(metadata): Fix spelling/typos (#10027)",
        "< | 3289f4593feaf014fb983a55e6ba6e80a0ead227 chore(release): link to previous releases and upgrade guides in the changelog (#10026)",
        "< | 43182f14cc5b6755a043bcce2cf158d444e6da78 chore(ci): add changelog check to ci (#9989)",
        "< | 7fc06486c8be34ae010294bb4ccf5170311d5ae2 fix(realtime): update logic for including sseLink (#10025)",
        "< | 903f8d426d4e62620fbe4c4292943028629e58f1 chore(k6 tests): update entry point (#10024)",
        "< | e4a7676cdfbf3c46165ba5185efab07dc7f1f395 feat(server): add docs on the server file (#10019)",
        "< | ad493cd79b606776a676961a9c158933cff0a612 fix(types): Fix TS type in createServer.test.ts (#10023)",
        "< | 4891360759adbf76bd7b70f9a67623cff47484e2 fix: Handle static assets on the \`rw-serve-fe\` (#10018)",
        "< | 0f158c2e7745e3a7900824c32f996ce80e84ee50 fix(server): fix env var loading in \`createServer\` (#10021)",
        "< | e2570881db4dc4a9635d94ddf96bfc23488e87cb fix(deps): remove react types packages from \`@redwoodjs/testing\` dependencies (#10020)",
        "< | 824ff14955ec30e8a616c8e5bdbce6d530d92689 chore(release): add back \`update-package-versions\` task (#10017)",
        "< | 85a0bfa346677518aca4cd80a16a92c663393bf2 chore(renovate): Disable for experimental apollo package (#10016)",
        "< | ef015ca4d2737d23dcb74cc5ea39c5e7a4c15d9d RSC: server cells lowercase data function (#10015)",
        "< | cfd4c9238269cbace63c988539170a5620dd1821 fix(RSC/SSR): pass CLI options through to apiServerHandler (#10012)",
        "< | 8b499f99235a654d14f629e5318368c0e22b743a 7.0 RC: Remove hardcoded check for \`session.id\` (#10013)",
        "< | ff138d1d63e3723650b7a2760b3f7628225f5f92 Spelling fix in what-is-redwood.md (#10011)",
        "< | 2e3b0f4a5c92b57df74748721998d2b57b3b30a5 Typos in realtime.md (#10010)",
        "< | 642238da6aa91c89dce80d9c3c1751d97808a333 RSC: Server cell smoke tests (#10008)",
        "< | d44e03afcf617ad90c903706032bda4f03462c95 RSC: test-project EmptyUser 'use client' cell (#10007)",
        "< | 0c5d91d9925cbee8b5f5fa15ad5d20e372d1e0d7 RSC: babel-plugin-redwood-cell remove redundant reset (#10006)",
        "< | d47bddcbbf61903648e9751af3ab949edb76d948 chore(deps): Upgrade to yarn v4.1.0 (#10002)",
        "< | 6132ed5cb4eafc17ee9a11399a33125b2e766dab fix(docs): Spelling of \`data-migrate\` command (#10003)",
        "< | fa2887cf9a9069bb0f4bd7249b362ff522e58bcc docs: add aliases fo \`type-check\` command (#10004)",
        "< | 0ef0289221781e9d2751507f1a17607694b43255 RSC: Insert 'use client' in scaffolded components (#9998)",
        "< | e5f09e49062af04aa030517930fb7e1e90ca5611 fix(telemetry): Fix 'destroy' spelling (#10000)",
        "< | dd8efec66891fd855de79d7321a69b75b0465890 chore(jsdocs): Fix jsdoc formatting for hover help (#9999)",
        "< | cba4a68547de1a7bf344d28672937e207d2cb196 bug: Update setupHandler.ts firebase version (#9997)",
        "< | 7c9dfd688dde35d843fead3135d76dae3126b515 RSC: Keep aligning test project with CRWA template (#9993)",
        "< | 7ee21cd87e8f3a8f14216ee0aa4b5e36c5405c92 RSC: Fix babel-plugin-redwood-cell to work wiht more than one cell (#9994)",
        "< | 43cb6414e102ba62354f7ae8a3b4af11763ef448 fix(dependencies): Use RW-specific version of apollo ssr package (#9992)",
        "< | 44a980bca870f28867a21e3927b983bbb3c5ad08 RSC: chore(test): Update RSC test fixture project (#9990)",
        "< | 45e6ce70ccdbbdfb612cc353f25e59e902eb5bce RSC: createServerCell (#9987)",
        "< | 85737712fc230bae3f550e6da8001b53141d78cf chore(refactor): Router: Splitting things up into smaller files (#9988)",
        "< | ed033ee59eb5ec178fe9e6fb02f0cfbf809d8e53 chore(project-config): make chore changes to trigger ci (#9985)",
        "< | 9b009b091b0f8102e05df4bb02c1e3f093ea5cea chore: update rsc fixture (#9986)",
        "< | 9df7377db14407ada2419c92b2dd30e1a42f4d1e fix(server): use file extension in import, fix graphql route registering (#9984)",
        "< | 50b455f7353baabe9775e264a9f9ee60d98303ca chore(deps): update babel monorepo (#9983)",
        "< | 9de6d0e38cf5c15d73f12eb8f72f5701e1253137 fix: unpin react types (#9727)",
        "< | 60d031db0612d57c961a205b7f1ee927fb70191d fix(docker): compose dev and prod (#9982)",
        "< | 2c15510f94bab59ce7b9173c7323b720b3dee076 fix(deps): update prisma monorepo to v5.9.1 (#9980)",
        "< | 180615bed290363e083caf15e2f4d23c29131185 fix(cli): use fetch instead of \`yarn npm info\` (#9975)",
        "< | bcf191dfaafcba8d40853078bef2ec9975cbb978 fix(test): Update createServer test to use a different port to normal (#9977)",
        "< | 4b06f06539d774937af297923be576c6a2ed582f fix(docker): corepack permissions fix and style updates (#9976)",
        "< | cd65bf6ff33675e85fd2f17caa1cfe4d7c8907b9 fix(deps) resolve yarn warnings regarding unmet peer dependencies for Redwood projects (#8874)",
        "< | 019361550736f5ed733c37d7f5241583f26d405b chore(build): use \`tsx\` to run build scripts (#9941)",
        "< | 3c04b6c3f986f68f25a5532ed74be99cc801464c RSC: Client Cell support smoke-test (#9974)",
        "< | 3bbb5f5c9946995d4bb5695ff715df868d742dc1 RSC: Enable babel plugins to get client Cell support (#9973)",
        "< | 57c5eca1a15b2cbbc2c600eaf6d8167983f590a3 RSC: Take full control over the env vars (#9972)",
        "< | f736662b8552fd998470fd4a684d97228226a108 RSC: Make RWJS_ENV etc available on the server during runtime (#9971)",
        "< | 11b678286e97081b65e8a575878016a16072fbb0 chore(cleanup): Remove debug console.log call (#9967)",
        "< | 906c143b2feccf8eb28859450888fa606c31df3d fix(studio): Remove unused settings 'endpoint' and 'roles' (#9966)",
        "< | f3a865d54b650fb1749e3bb1ad5abf42dc643c2b cli: Remove graphiql setup command (#9964)",
        "< | b0d60f3ccf97827fd9cabe8289f8deaac6568999 fix(cell-suspense): pass through variables if passed to refetch (#9965)",
        "< | d2b7f7fb4d70243616d9f9dcf7c5bfe1e6a4981f Mention the you need corepack enabled to run this repo (#9960)",
        "< | b930777e64276cfcb7a8f340e1dd8f7053e9956f chore(server): improve server tests (#9958)",
        "< | 5aa69919a66ca271f19fe82d9111a5583015020e feat(gql): Codemod existing projects to get newest gql config (#9959)",
        "< | 1039545a171adee0ace8f6ad9f85b495e08b2fe6 Update Studio docs (#9955)",
        "< | 70c1c19d861c0efba94a31cb699bcf530067cf81 fix(gql): Better graphql.config.js template (#9957)",
        "< | c6cacf4dfb18bd95ab8a5143466d8c67ff00764d fix(studio): Remove unused setting inMemory (#9956)",
        "< | 3fe639eff701625e3c8febf22b6fb8cb19d94df7 docs(typo): Removed \`rw\` from \`yarn install\` command (#9954)",
        "< | 2d0100d60e4237bd82b230cc5f7ae3c5fc77a8b0 chore(deps): update dependency firebase to v10.7.0 (#9605)",
        "< | 8ae6eb1ab306e9a3a925d9dbe9eb84c57f2cc67e chore: update yarn.lock",
        "< | 469770d580b015309e26b9a9529044c9cda5a886 fix(deps): update dependency firebase-admin to v11.11.1 (#9953)",
        "< | c409341ab3e077ecbc8e84626080c22b215f45fd chore(api-server): switch to vitest (#9929)",
        "< | 4773fc8653a10db40d67102561d96490cf5b9cff chore(test): Remove yarn.lock from some test fixtures (#9952)",
        "< | 7bce9b04a4e880c5d6deb801a2924150277f9dee fix(deps): update dependency nodemailer to v6.9.9 [security] (#9951)",
        "< | c578051190384309b874d573f0ecb24b4df741e6 fix(api-server): Remove duplicate command alias (#9950)",
        "< | 80f499e521c501c92959cae715ca80ee92225895 fix(server): spelling, fix deploy handler imports, dedupe server builder (#9949)",
        "< | 887dba98722ea48ed97304287e1e9727d46a9577 feat(server): dedupe api server code, make host configurable (#9948)",
        "< | 909eeac01f36a1b08a93187338ae3b7f60655ab1 chore(ts): Remove src alias and baseUrl from all tsconfigs (#9944)",
        "< | 8247653ea1299ab30f3aa17cc94b5c6c2b594933 @redwoodjs/framework-tools for buildDefaults (#9947)",
        "< | a7b1573148970062549c4c4ab9b53c9fa1a4f270 fix(internal): Remove unused import (#9946)",
        "< | 21237efcff9fcde4dbdbce9120acd920f204d332 chore(crwa): Use actual filename in seed file template (#9945)",
        "< | 2d9c9bb9d459298e4fbaf753908372f579bd745c fix(cli): Prevent caching blank information about plugins (#9942)",
        "< | 199fce1c4c339fdc5fa50ca0bcb38d42d4ddf2c7 chore(apollo): Introduce TS type helper to reduce repetition (#9943)",
        "< | ff7d79cd0df190656557e922d698a8f69138bef4 feat(middleware): Add support for Middleware to SSR-Streaming server (#9883)",
        "< | 7fdf7bb427b6cfcf0d74c1f9f84191b72798efc2 chore(deps): update node.js to v20 (#9936)",
        "< | d134f427938b5a2127c67b626902e8043b328844 feat(crwa): Make the seed template idempotent (#9937)",
        "< | b31bb6ae4bb681ef6d20235f8dc9d2613f56a345 docs(monitoring): Add Sentry docs (#9934)",
        "< | a0cfcc9b5519074bc7c391426e98637487fcd7e5 fix(deps): update prisma monorepo to v5.9.0 (#9935)",
        "< | 8d07dc2d4f5a63b02db134ca0942ae94366270d3 fix(docusaurus): Make {jsx,tsx} file extensions switch properly (#9933)",
        "< | edfdf99bb852ad17e9ebc48c98bb92f2b15bf628 fix(server): don't mix async and callback styles (#9931)",
        "< | 43bc6ebc44880f9a2173fca7a784fbb0526d6bec chore(forms): switch tests to vitest (#9928)",
        "< | 472c86bed8f1ee6d7a528ca6d494406553fc072e fix(web): import helmet from node_modules (#9927)",
        "< | 63aba23069fb737f63cdb4f48178fd1f73949dce chore(deps): update dependency @testing-library/jest-dom to v6.3.0 (#9926)",
        "< | 5227b71c20ba3966d6436d08164712b9453bff8e chore(deps): update dependency @clerk/clerk-react to v4.30.3 (#9922)",
        "< | e03108c4c8adaf3ca644b540ec97b0826dee5122 fix(deps): update dependency @testing-library/user-event to v14.5.2 (#9925)",
        "< | fb47d08c3d07cfd1e00f47f3475139ba3486b36f chore(deps): update dependency @testing-library/dom to v9.3.4 (#9924)",
        "< | 491cef16d97b35d7ab98e22dc2e85794f9c7e62f fix(deps): update dependency @clerk/clerk-sdk-node to v4.13.7 (#9923)",
        "< | c67a74d2a8e54a68b04768f70a6964cad1d68b33 fix(deps): update dependency core-js to v3.35.1 (#9919)",
        "< | 120ab90e41ce3b8069c176d50d721244ef24c82c fix(deps): update dependency fastify to v4.25.2 (#9920)",
        "< | 441e754557ab803ff9628a36da5f94dd08a23593 fix(deps): update dependency graphql-sse to v2.5.2 (#9921)",
        "< | 970205bd28b9c7a8093ae806c9d523f2e2a9feb7 chore(deps): update dependency @playwright/test to v1.41.1 (#9918)",
        "< | 013f9c2623d408f66315546c58c0f1802731f731 fix(deps): update apollo graphql packages (#9916)",
        "< | ce0a064f8787b7440ac292f7faeb2518fee06f02 chore(deps): update dependency vitest to v1.2.2 (#9915)",
        "< | b9af37b39591b0004a47c97d34914de5aae22145 fix(deps): update storybook monorepo to v7.6.10 (#9917)",
        "< | c63f332164b30261af58d4dde0e8a6743557d96d chore(deps): update dependency lerna to v8.0.2 (#9914)",
        "< | fb9f3023bf1387feed25e33282a0178d1b6df260 chore(deps): bump follow-redirects from 1.15.2 to 1.15.4 (#9817)",
        "< | d7e343b134a79081a52debf03b895a4cd5029de8 fix(deps): update dependency vite to v4.5.2 [security] (#9852)",
        "< | 36d49bc944a3a296eb54c7ad0a3f33eb7c50843c chore(deps): bump @fastify/reply-from from 9.4.0 to 9.6.0 (#9813)",
        "< | e4ff05157a462b41443955ec831fa93d00d24c59 chore(deps): bump follow-redirects from 1.15.3 to 1.15.4 in /docs (#9818)",
        "< | 5809391d19ca149840df5b9ff8e7823a876cd408 fix(deps): update dependency @graphql-yoga/redis-event-target to v3 (#9909)",
        "< | e16e32cfb24361032089a524aa6de5abacafba10 fix(deps): update dependency @graphql-yoga/plugin-graphql-sse to v3 (#9907)",
        "< | c3d840d712d23a0cb2614edaac4e6786b300da77 cli-helpers: Don't emit tests to dist/ (#9900)",
        "< | 7d12474863b9d931c182e8c48ccb38bf4fabb8d4 fix(deps): update dependency @graphql-yoga/plugin-persisted-operations to v3 (#9908)",
        "< | 381850cbf01380a3c9c7bd22ff6223fe4f817d1b fix(deps): update dependency @graphql-yoga/plugin-defer-stream to v3 (#9906)",
        "< | d9b87ea51d80fd855175830bc72660879dbf93ba fix(deps): update dependency @graphql-yoga/subscription to v5 (#9912)",
        "< | 7b8d35965013f797d605b34a7386dd623f0bdd65 chore(tests): api-server: Improve types (#9896)",
        "< | 891bb19442f272f59ada236526a6f09fe3af7057 fix(deps): update dependency graphql-yoga to v5.1.1 (#9913)",
        "< | 0ca122430ffb6173d5e4be1712cb1a2d57958110 fix(deps): update dependency react-hook-form to v7.49.3 (#9910)",
        "< | ffeb9bbb72f2889d609e858b96ffadc262c7df4e fix(deps): update dependency webpack to v5.90.0 (#9911)",
        "< | ffc0fc5de7f2e662b2257287ca65cfbd4025b729 fix(deps): update dependency @envelop/depth-limit to v4 (#9905)",
        "< | 15da3edcca0da7cbd7465f6206288a4f4ccbc02f fix(deps): update dependency @envelop/on-resolve to v4 (#9904)",
        "< | f01a9441cd69323e82befd236b1927692a2ec7b1 fix(deps): update dependency @envelop/live-query to v7 (#9903)",
        "< | cc10a4324f04d8361b42c9b521536295120f1c8d fix(deps): update dependency @envelop/filter-operation-type to v6 (#9902)",
        "< | f71f12b8d58840d18541ade7f979c80d258b3d02 chore(deps): update dependency @envelop/testing to v7 (#9898)",
        "< | 2710b2bd1542596108f680611f9b726c5d3c1f35 fix(deps): update dependency @envelop/disable-introspection to v6 (#9901)",
        "< | 33c2d60e48c3b672ffc2819e20777f9f64e8ef59 chore(deps): update dependency @envelop/types to v5 (#9899)",
        "< | 5a320f3b688e5918991bb9f9bc807b6587d4c062 chore(deps): update dependency esbuild to v0.20.0 (#9897)",
        "< | f9c9b8f5073e87aef517836e7485d42e05c438d9 chore(deps): update babel monorepo (#9892)",
        "< | 27353fef2007eccf484dca6075eb1a30bc4d6ba3 fix(serve): fix server listening logs (#9894)",
        "< | 965132eeef08619ce4d221089c826cadef6236d0 fix(studio): Bump minimum RW canary version (#9895)",
        "< | cbf13c65599b3b913719d4d739ad9155eaa0b221 fix(deps): update prisma monorepo to v5.8.1 (#9893)",
        "< | ca5d00f38ef89ce2f20ba9430045276582a30a6c chore(cli): Move coerceRootPath() (#9891)",
        "< | 97296d4c57e6dffb4eee2489397a3486d11e24fd chore(tests): api-server: Suppress logs (#9890)",
        "< | e1216e92ee9cd1bc85bdcb04d8c78481b7f6ea9a chore(server): dedupe web serve logic (#9884)",
        "< | d1058b3a9591ab513648f0ba863f18236045bcff chore(fixtures): Update gql file content as a result of trusted documents fix (#9889)",
        "< | e1e3f35e657743eac545e7592f1a6cb774f27b05 fix(gql): Add back gql global type (#9888)",
        "o | 802c2519c6623bf3bd52c9c9628d61d2bbeea0ba Update installation.md (#9887)",
        " /  ",
        "o 49965f4db294112458dccabfce2b7044f3134bcb v7.0.0",
      ]
    `)
  })
})

test('lineIsGitLogUi', () => {
  expect(lineIsGitLogUi("|\\")).toEqual(true)
  expect(lineIsGitLogUi("/")).toEqual(true)
  expect(lineIsGitLogUi("o 49965f4db294112458dccabfce2b7044f3134bcb v7.0.0")).toEqual(true)
  expect(lineIsGitLogUi("o | 802c2519c6623bf3bd52c9c9628d61d2bbeea0ba Update installation.md (#9887)")).toEqual(true)

  expect(lineIsGitLogUi("< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")).toEqual(false)
  expect(lineIsGitLogUi("< | 8b467685a7cdce55f8be6424793bc5e6ad450c0a chore(docs): align v6 docs with the next branch (#10034)")).toEqual(false)
})

test('lineIsAnnotatedTag', () => {
  expect(lineIsAnnotatedTag("v7.0.0")).toEqual(true)

  expect(lineIsAnnotatedTag("< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")).toEqual(false)
  expect(lineIsAnnotatedTag("< c9d225b4a401dd6afe282973fc7646bcbe101344 chore(changelog): add v7 (#10038)")).toEqual(false)
  expect(lineIsAnnotatedTag("<   635d6dea677b28993661a2e46659ff8c987b7275 Merge branch 'release/major/v7.0.0'")).toEqual(false)
  expect(lineIsAnnotatedTag("< | b9af37b39591b0004a47c97d34914de5aae22145 fix(deps): update storybook monorepo to v7.6.10 (#9917)")).toEqual(false)
})

test('lineIsChore', () => {
  expect(lineIsChore("<   635d6dea677b28993661a2e46659ff8c987b7275 Merge branch 'release/major/v7.0.0'")).toEqual(true)
  expect(lineIsChore("< | 8ae6eb1ab306e9a3a925d9dbe9eb84c57f2cc67e chore: update yarn.lock")).toEqual(true)

  expect(lineIsChore("< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")).toEqual(false)
  expect(lineIsChore("< | 8b467685a7cdce55f8be6424793bc5e6ad450c0a chore(docs): align v6 docs with the next branch (#10034)")).toEqual(false)
})

describe('resolveLine', async () => {
  let resetCwd: () => void
  beforeAll(async () => {
    resetCwd = await assertRwfwPathAndSetCwd()
  })
  afterAll(() => {
    resetCwd()
  })

  const range = {
    from: 'main',
    to: 'next'
  }

  it('works', async () => {
    const line = "< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)"
    const milestone = 'chore'

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line: [line.padEnd(PADDING), `(${milestone})`].join(' '),
      type: "commit",
      ref: range.to,
      notes: undefined,

      hash: "487548234b49bb93bb79ad89c7ac4a91ed6c0dc9",
      message: "chore(deps): update dependency @playwright/test to v1.41.2 (#10040)",

      pr: "10040",
      url: "https://github.com/redwoodjs/redwood/pull/10040",
      milestone,
    })
  })

  it('ui', async () => {
    const line = "|\\"

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line,
      type: 'ui',
      ref: range.from,
    })
  })

  it('chore', async () => {
    const line = "<   635d6dea677b28993661a2e46659ff8c987b7275 Merge branch 'release/major/v7.0.0'"

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line,
      type: 'chore',
      ref: range.from,

      hash: "635d6dea677b28993661a2e46659ff8c987b7275",
      message: "Merge branch 'release/major/v7.0.0'",
    })
  })

  it('annotated tag', async () => {
    const line = "< 49965f4db294112458dccabfce2b7044f3134bcb v7.0.0"

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line,
      type: "tag",
      ref: "v7.0.0",

      hash: "49965f4db294112458dccabfce2b7044f3134bcb",
      message: "v7.0.0",
    })
  })


  it('no pr', async () => {
    const line = "< | 8ae6eb1ab306e9a3a925d9dbe9eb84c57f2cc67e chore: update yarn.lock"

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line,
      type: 'chore',
      ref: range.from,

      hash: "8ae6eb1ab306e9a3a925d9dbe9eb84c57f2cc67e",
      message: "chore: update yarn.lock",
    })
  })

  it('ref', async () => {
    const line = "< | e1e3f35e657743eac545e7592f1a6cb774f27b05 fix(gql): Add back gql global type (#9888)"
    const milestone = 'v7.0.0'

    const commit = await resolveLine(line, { range })
    expect(commit).toEqual({
      line: [line.padEnd(PADDING), `(${milestone})`].join(' '),
      type: 'commit',
      ref: range.to,

      hash: "e1e3f35e657743eac545e7592f1a6cb774f27b05",
      message: 'fix(gql): Add back gql global type (#9888)',

      pr: "9888",
      url: "https://github.com/redwoodjs/redwood/pull/9888",
      milestone,
    })
  })
})

test('getPrettyLine', () => {
  const range = { from: 'main', to: 'next' }
  const commit = { line: 'line' } 

  commit.type = 'ui'
  expect(getPrettyLine(commit, { range })).toEqual(colors.choreOrDecorative(commit.line))
  commit.type = 'tag'
  expect(getPrettyLine(commit, { range })).toEqual(colors.choreOrDecorative(commit.line))
  commit.type = 'chore'
  expect(getPrettyLine(commit, { range })).toEqual(colors.choreOrDecorative(commit.line))

  commit.type = 'commit'
  commit.ref = range.to
  expect(getPrettyLine(commit, { range })).toEqual(colors.wasCherryPickedWithChanges(commit.line))

  commit.ref = range.from

  commit.milestone = 'SSR'
  expect(getPrettyLine(commit, { range })).toEqual(colors.shouldntBeCherryPicked(commit.line))
  commit.milestone = 'RSC'
  expect(getPrettyLine(commit, { range })).toEqual(colors.shouldntBeCherryPicked(commit.line))
  delete commit.milestone
  commit.notes = 'abc'
  expect(getPrettyLine(commit, { range })).toEqual(colors.shouldntBeCherryPicked(commit.line))
})
