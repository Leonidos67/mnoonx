import type { FC } from 'react';
import type { PixelBlastProps } from './pixelBlastTypes';
import PixelBlastImpl from './PixelBlast';

const PixelBlast: FC<PixelBlastProps> = (props) => <PixelBlastImpl {...props} />;

export default PixelBlast;
export type { PixelBlastProps } from './pixelBlastTypes';
