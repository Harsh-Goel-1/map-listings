'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function GoogleMapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider apiKey={apiKey}>
      {children}
    </APIProvider>
  );
}
