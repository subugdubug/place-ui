import { useEffect, useState } from 'react';
import { Button, Menu, Text, Box, MenuButton, MenuList, MenuItem, Badge, useToast } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useWallet } from '../context/WalletProvider';
import { shortenAddress } from '../lib/address';
import { useCanvasService } from '../context/CanvasServiceProvider';

const WalletButton = () => {
  const { isConnected, address, balance, connect, disconnect } = useWallet();
  const { canvasService } = useCanvasService();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestPaint = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test painting a pixel in the center of the canvas
      toast({
        title: "Sending test transaction",
        description: "Your wallet should prompt you to sign a transaction",
        status: "info",
        duration: 10000,
        isClosable: true,
      });

      console.log("Testing paint pixel at 50,50 with white color");
      const result = await canvasService.paintPixel(50, 50, "#FFFFFF");
      
      if (result.success) {
        toast({
          title: "Transaction sent successfully",
          description: `Transaction hash: ${result.transactionHash?.substring(0, 10)}...`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Transaction failed",
          description: result.error || "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {!isConnected ? (
        <Button
          onClick={connect}
          colorScheme="purple"
          isLoading={isLoading}
        >
          Connect Wallet
        </Button>
      ) : (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            colorScheme="purple"
          >
            {shortenAddress(address)}
            {balance && (
              <Badge ml={2} colorScheme="green">
                {balance} ETH
              </Badge>
            )}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={handleTestPaint} isDisabled={isLoading}>
              Test Paint Pixel
            </MenuItem>
            <MenuItem onClick={disconnect}>Disconnect</MenuItem>
          </MenuList>
        </Menu>
      )}
    </Box>
  );
};

export default WalletButton; 