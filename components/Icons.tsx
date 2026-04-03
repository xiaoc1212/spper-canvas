import React from 'react';
import * as Lucide from 'lucide-react';

interface IconProps extends Lucide.LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = (Lucide as any)[name];

  if (!IconComponent) {
    return <Lucide.BoxSelect {...props} />;
  }

  return <IconComponent {...props} />;
};
