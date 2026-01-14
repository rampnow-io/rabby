import { X } from 'lucide-react';
import { Container, Content } from '@repo/ui';

import AddAddressOptions from '../../AddAddressOptions';
import { UIContainer } from '@/ui/provider';
import { useHistory } from 'react-router-dom';

const AddWallet = () => {
  const history = useHistory();
  return (
    <UIContainer>
      <Container>
        <div className="p-6 flex justify-between items-center">
          <div className="text-2xl font-semibold text-primary-foreground">
            Accounts
          </div>
          <X
            size={24}
            onClick={() => {
              history.goBack();
            }}
            className="cursor-pointer text-gray-600 hover:text-gray-800"
          />
        </div>
        <Content>
          <AddAddressOptions />
        </Content>
      </Container>
    </UIContainer>
  );
};

AddWallet.displayName = 'AddWallet';

export default AddWallet;
