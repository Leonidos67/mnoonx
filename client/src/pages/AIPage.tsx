import { Navigate } from 'react-router-dom';

/** @deprecated Use /discover?tab=market */
const AIPage: React.FC = () => <Navigate to="/discover?tab=market" replace />;

export default AIPage;
