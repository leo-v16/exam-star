import { MetadataRoute } from 'next';
import { getAllExamIdsAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://exam-star.vercel.app';

  const lastModified = new Date().toISOString();

  // ✅ Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // ✅ Dynamic exam pages
  const examResult = await getAllExamIdsAction();
  const examRoutes: MetadataRoute.Sitemap = (examResult.data ?? []).map(
    (examId: string) => ({
      url: `${baseUrl}/exam/${encodeURIComponent(examId)}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  );

  return [...staticRoutes, ...examRoutes];
}
