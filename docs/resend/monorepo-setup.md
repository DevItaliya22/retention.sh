> ## Documentation Index
>
> Fetch the complete documentation index at: https://react.email/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up for pnpm workspaces

> Configure React Email on a pnpm monorepo

## 1. Create workspace

Create a new folder called `transactional` inside of where you keep workspace packages (generally `./packages/*`) and
in there setup a new `package.json` and do not forget to add this to your `pnpm-workspace.yaml`.

<Card title="React Email + Turborepo + pnpm example" icon="arrow-up-right-from-square" href="https://github.com/resend/react-email-turborepo-pnpm-example">
  See the full source code
</Card>

## 2. Install dependencies

Install React Email in the `transactional` workspace.

```sh packages/transactional theme={null}
pnpm add react-email @react-email/preview-server -D -E
pnpm add @react-email/components react react-dom -E
```

## 3. Add scripts

Include the following script in your `package.json` file.

```json packages/transactional/package.json theme={null}
{
  // ...
  "scripts": {
    "dev": "email dev"
  }
  // ...
}
```

## 4. Write your emails

Create a new folder called `emails`, create a file inside called `email.tsx` and add the following example code:

```jsx packages/transactional/emails/email.tsx theme={null}
import { Button, Html, Head, Body } from "@react-email/components";
import * as React from "react";

export default function Email() {
  return (
    <Html>
      <Head />
      <Body>
        <Button
          href="https://example.com"
          style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
        >
          Click me
        </Button>
      </Body>
    </Html>
  );
}
```

## 5. Run preview server

Start the email previews development server:

```sh packages/transactional theme={null}
pnpm dev
```

## 6. See changes live

Visit [localhost:3000](http://localhost:3000) and edit the `emails/email.tsx` file to see the changes.

<Frame>
  <img alt="Local Development" src="https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=1e1054377b1c05089231df85d9bb7f51" data-og-width="3840" width="3840" data-og-height="2500" height="2500" data-path="images/manual-setup-dev.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=280&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=74aba19b0042b8b76a7f094a9f639131 280w, https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=560&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=3674c6a1c9c1e63f1c48383e84f935d2 560w, https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=840&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=1358a63442bf4689c2ed03deb222e165 840w, https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=1100&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=f6d74d331e18a217a3a8c2525db3edc8 1100w, https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=1650&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=cc31b2e11bd0c28e7411a76063e13e42 1650w, https://mintcdn.com/react-email/6RLPyy-TJtRfD3cU/images/manual-setup-dev.png?w=2500&fit=max&auto=format&n=6RLPyy-TJtRfD3cU&q=85&s=b5825a3458dd99f9f3238756818d1905 2500w" />
</Frame>

## 7. Try it yourself

<Card title="React Email + Turborepo + pnpm example" icon="arrow-up-right-from-square" href="https://github.com/resend/react-email-turborepo-pnpm-example">
  See the full source code
</Card>
