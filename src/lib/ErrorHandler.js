import { log } from '@/lib/Logger';
import { COMMUNICATION_LINKS_FAILURE, UNAUTHORIZED, INTERNAL_SERVER_ERROR, FORBIDDEN, BAD_REQUEST, INVALID_TOKEN } from '@/lib/HttpStatuses';
import UnauthorizedError from '../errors/UnauthorizedError';
import AppNotEnabledError from '../errors/AppNotEnabledError';
import InsufficientPermissionsError from '../errors/InsufficientPermissionsError';
import SessionNotFound from '../errors/SessionNotFound';
import MissingHeaderError from '../errors/MissingHeaderError';
import InvalidTokenError from '../errors/InvalidTokenError';
import { serverSideLogout } from './Session';

// CLIENT SIDE STUFF
import RootContext from '@/components/contexts/RootContext';
import { SET_IS_TOKEN_EXPIRED } from '@/lib/actions';
import { useContext } from 'react';

export async function defaultErrorHandler(error, req, res) {
  
  await log(error.stack);
  
  if (
    error instanceof UnauthorizedError ||
    error instanceof SessionNotFound
    ) {
      res.status(UNAUTHORIZED).json({message: 'Authentication required.'});
  } else if (
    error instanceof AppNotEnabledError || 
    error instanceof InsufficientPermissionsError
  ) {
      res.status(FORBIDDEN).json({message: 'Forbidden.'});
  } else if (
    error instanceof MissingHeaderError
  ) {
      res.status(BAD_REQUEST).json({message: 'Bearer token is missing.'});
  } else if (
    error instanceof InvalidTokenError ||
    error.name === 'JsonWebTokenError'
  ) {
      res.status(INVALID_TOKEN).json({ message: 'Invalid or expired token.' });
  } else if (
    error.name === 'TokenExpiredError'
  ) {
      await serverSideLogout(req);
      res.status(INVALID_TOKEN).json({ message: 'Token expired. Please log in again.' });
  } else {
      /* Let's be conservative on our regex*/
      if (error.stack.match(/Communications\s+link\s+failure/gi)) {
        //Let the client side retry.
        res.status(COMMUNICATION_LINKS_FAILURE).json({message: 'The database may be warming up. Please try again.'});
      } else {
        //Do not reveal anything to the user. This might be an opportunity for intruders
        //to get into the system.
        res.status(INTERNAL_SERVER_ERROR).json({message: 'Internal server error. Check the logs for details.'});
      }
  }
} 

export function useClientErrorHandler() {
  const { state, dispatch } = useContext(RootContext);

  return (err) => {
      if(err.message === 'Token expired. Please log in again.') {
        dispatch({ type: SET_IS_TOKEN_EXPIRED, payload: true });
      }
  }
}
