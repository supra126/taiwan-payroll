/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['taiwan-payroll'],
  images: { unoptimized: true },
};
export default nextConfig;
