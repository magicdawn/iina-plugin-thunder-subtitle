import { createTRPCProxyClient } from '@trpc/client'
import { createIINATrpcLink } from 'trpc-iina/client'
import type { AppRouter } from '../../src-plugin/src/trpc-server'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    createIINATrpcLink({
      nsp: 'iina-plugin-thunder-subtitle',
    }),
  ],
})
