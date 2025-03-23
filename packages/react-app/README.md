# CeloSubPay PWA

A Progressive Web App for managing DeFi-based subscription payments on the Celo blockchain.

## Features

- **Wallet Integration**: Connect your crypto wallet using RainbowKit
- **Role-based Access**: Support for both Subscribers and Business users
- **Subscription Management**: Create, manage, and cancel subscription plans
- **Real-time Analytics**: Track revenue, active users, and churn rate
- **Offline Support**: Access basic features without internet connection
- **Push Notifications**: Receive updates about payments and subscription status
- **Responsive Design**: Seamless experience across desktop and mobile devices

## Tech Stack

- Next.js 15
- Tailwind CSS
- RainbowKit
- Wagmi
- Framer Motion
- Radix UI
- TypeScript

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up environment variables:
   ```bash
   cp .env.template .env.local
   ```
   Fill in the required environment variables:
   - `NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS`: Your deployed CeloSubPay contract address
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Your VAPID public key for push notifications

3. Run the development server:
   ```bash
   yarn dev
   ```

4. Build for production:
   ```bash
   yarn build
   ```

5. Start the production server:
   ```bash
   yarn start
   ```

## Project Structure

```
packages/react-app/
├── app/                    # Next.js app directory
│   ├── business/          # Business dashboard pages
│   ├── subscriber/        # Subscriber dashboard pages
│   └── layout.tsx         # Root layout with PWA meta tags
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── hooks/                # Custom React hooks
│   ├── useSubPay.ts      # Smart contract interaction
│   └── usePushNotifications.ts  # Push notification management
├── lib/                  # Utility functions and constants
├── public/              # Static assets
│   ├── icons/          # PWA icons
│   ├── manifest.json   # PWA manifest
│   └── sw.js           # Service worker
└── styles/             # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Using **yarn**

```bash
yarn
```

or using **npm**

```bash
npm i
```

> React + Tailwind CSS Template does not have any dependency on hardhat.
> This starterkit does not include connection of Hardhat/Truffle with ReactJS. It's up to the user to integrate smart contract with ReactJS. This gives user more flexibility over the dApp.

- To start the dApp, run the following command.

```bash
yarn dev
```

## Dependencies

### Default

- [Next.js](https://nextjs.org/) app framework
- [TailwindCSS](https://tailwindcss.com/) for UI

## Architecture

- `/pages` includes the main application components (specifically `layout.tsx` and `page.tsx`)
  - `layout.tsx` includes configuration
  - `page.tsx` is the main page of the application
- `/components` includes components that are rendered in `page.tsx`
- `/public` includes static files

