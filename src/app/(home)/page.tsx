import { HydrateClient, trpc } from "@/trpc/server";
import { HomeView } from "@/modules/home/ui/views/home-view";
import { DEFAULT_LIMIT } from "@/constants";

export const dynamic = 'force-dynamic'; //disable static rendering for this page -> always render on server on each request
//this is important, because we want to prefetch data on each request, so client component always has fresh data
//https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-on-every-request
//folder in parenthesis -> not part of url route

// export default async function Home() {
//   void trpc.categories.getMany.prefetch();
//   // void trpc.hello.prefetch({text:"sammas24"}); //pre-fetch data on server side. tRPC is not used in server components, so we need to prefetch it here and use it in client component
//   //with that you populate data cache on server side, so when client component is rendered, it can use the cached data -> faster

//   // const data = await trpc.hello({text: 'sammas24'}); //fetch from server component --> more efficient but lose interactivity --> search for hybrid solution



//   return (
//     <div>
//       <HydrateClient>
//             <HomeView />
//             <Suspense fallback={<p>Loading...</p>}>
//               <ErrorBoundary fallback={<p>Something went wrong</p>}>
//                 <PageClient />
//               </ErrorBoundary>
//             </Suspense>
//         </HydrateClient>
//        {/* Client component says: {data.greeting} */}
//     </div>
//   );
// }

interface PageProps {
    searchParams: Promise<{
        categoryId?: string;
    }>
}


const Page = async ({ }: PageProps) => { //destructure searchParams
    void trpc.categories.getMany.prefetch();
    void trpc.home.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
    // const { categoryId } = await searchParams; //await the promise to get the actual search params

    return (
        // <HydrateClient>
        //   {/* <ExplorerView categoryId={categoryId}/> */}
        //   <p>A</p>
        // </HydrateClient>

        <main>
            <HydrateClient>
                <HomeView />
            </HydrateClient>
        </main>
    )

}

export default Page;
