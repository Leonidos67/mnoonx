import type { FC } from 'react';
import type { GrainientProps } from './grainientTypes';
import GrainientImpl from './Grainient';

const Grainient: FC<GrainientProps> = (props) => <GrainientImpl {...props} />;

export default Grainient;
export type { GrainientProps } from './grainientTypes';
