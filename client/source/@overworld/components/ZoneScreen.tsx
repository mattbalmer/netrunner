import * as React from 'react';
import { FlexCol } from '@client/components/FlexCol';
import { Button, Divider, Typography } from '@mui/material';
import { LevelsList } from '@overworld/components/LevelsList';
import { FlexRow } from '@client/components/FlexRow';
import { useOverworld } from '@overworld/hooks/use-overworld';
import { SimpleDialog } from '@client/components/SimpleDialog';
import { ConfirmDialog } from '@client/components/ConfirmDialog';
import { playerCapsule } from '@client/capsules/player';
import { FEEDBACK_URL } from '@client/constants/feedback';
import { transitionsCapsule } from '@client/capsules/transitions';
import { itemCountFormatted } from '@shared/utils/game/player';
import { Items } from '@shared/constants/items';
import { Zone } from '@shared/types/game';
import { useMemo } from 'react';
import { ZoneID, Zones } from '@shared/constants/zones';
import { ZonesList } from '@overworld/components/ZonesList';
import { VendorID } from '@shared/constants/vendors';
import { vendorsCapsule } from '@client/capsules/vendors';
import { VendorsList } from '@overworld/components/VendorsList';

export const ZoneScreen = ({
  zone,
  levels,
}: {
  zone: Zone,
  levels: string[],
}) => {
  const [showConfirmReset, setShowConfirmReset] = React.useState<boolean>(false);
  const [showConfirmTutorial, setShowConfirmTutorial] = React.useState<boolean>(false);
  const {
    player, setPlayer,
    dialog, setDialog,
  } = useOverworld('zone', zone.id, {
    showConfirmTutorial, setShowConfirmTutorial
  });

  const adjacent = useMemo(() => {
    return (zone.adjacent as ZoneID[]).map(adjacentID => {
      const adjacent = Zones[adjacentID];
      return {
        id: adjacentID as ZoneID,
        name: adjacent?.name,
        canVisit: adjacent?.canVisit(player),
      }
    });
  }, [zone.adjacent]);

  const vendors = useMemo(() => {
    return (zone.vendors as VendorID[]).map(vendorID => {
      const vendor = vendorsCapsule.getVendor(vendorID);
      return {
        id: vendorID,
        name: vendor?.name,
        canVisit: vendor?.canVisit(player),
      }
    });
  }, [zone.vendors]);

  const handleReset = () => {
    setShowConfirmReset(false);
    playerCapsule.flush();
    transitionsCapsule.flush();
    vendorsCapsule.flush();
    window.location.href = '/play';
  };

  return <FlexCol sx={{ flexGrow: 1, p: 2 }}>
    <Typography variant={'h5'} sx={{ mb: 2 }}>Overworld &gt; {zone.name}</Typography>
    <FlexRow>
      {adjacent.length > 0 &&
        <FlexCol sx={{ pr: 4, mr: 4 }}>
          <Typography variant={'subtitle1'}>Travel to</Typography>
          <Divider />
          <ZonesList
            zones={adjacent}
          />
        </FlexCol>
      }
      {vendors.length > 0 &&
        <FlexCol sx={{ pr: 4, mr: 4 }}>
          <Typography variant={'subtitle1'}>Vendors</Typography>
          <Divider />
          <VendorsList
            vendors={vendors}
          />
        </FlexCol>
      }
      {levels.length > 0 &&
        <FlexCol sx={{ pr: 4, mr: 4 }}>
          <Typography variant={'subtitle1'}>Levels</Typography>
          <Divider />
          <LevelsList
            levels={levels}
            history={player.history}
          />
        </FlexCol>
      }
      <FlexCol sx={{ pr: 4, mr: 4 }}>
        <Typography variant={'subtitle1'}>Player</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant={'body1'}>HP: {player.bodyHP}</Typography>
        <Typography variant={'body1'}>Mental HP: {player.mental}</Typography>
        <Typography variant={'body1'}>Money: {itemCountFormatted(player, Items.Money.id)}</Typography>
        <Typography variant={'body1'}>XP: {player.xp}</Typography>
        <Typography variant={'body1'}>Actions per turn: {player.actions}</Typography>
        <Typography variant={'body1'}>RAM: {player.ram.max}</Typography>
        <Typography variant={'body1'} sx={{ ml: 1 }}>RAM/turn: {player.ram.recovery}</Typography>
        <Typography variant={'body1'}>Icebreaker:</Typography>
        <Typography variant={'body1'} sx={{ ml: 1}}>Barrier: {player.stats.icebreaker.barrier}</Typography>
        <Typography variant={'body1'} sx={{ ml: 1}}>Sentry: {player.stats.icebreaker.sentry}</Typography>
        <Typography variant={'body1'} sx={{ ml: 1}}>Codegate: {player.stats.icebreaker.codegate}</Typography>
        <Typography variant={'body1'}>Recon:</Typography>
        <Typography variant={'body1'} sx={{ ml: 1}}>Info: {player.stats.recon.info}</Typography>
      </FlexCol>
      <FlexCol>
        <Typography variant={'subtitle1'}>Actions</Typography>
        <Divider />
        <Button onClick={() => setShowConfirmReset(true)}>Reset Game</Button>
        <Button href={FEEDBACK_URL} target={'_blank'}>Give Feedback</Button>
        <Button href={'/play/inventory'}>Hard Drive</Button>
        <Button href={'/play/deck'}>Deck</Button>
        <Button href={'/play/implants'}>Implants</Button>
      </FlexCol>
    </FlexRow>
    <SimpleDialog
      id={'overworld-dialog'}
      isOpen={!!dialog}
      title={dialog?.title}
      acknowledge={dialog?.acknowledge}
      onClose={dialog?.onFinish}
    >{dialog?.body}</SimpleDialog>
    <ConfirmDialog
      id={'overworld-confirm-reset-dialog'}
      isOpen={showConfirmReset}
      title={'Reset Game'}
      onCancel={() => setShowConfirmReset(false)}
      onConfirm={handleReset}
      cancelText={'Cancel'}
      confirmText={'Reset'}
      color={'error'}
    >Are you sure you want to reset the game?</ConfirmDialog>
    <ConfirmDialog
      id={'overworld-confirm-tutorial-dialog'}
      isOpen={showConfirmTutorial}
      title={'New Player?'}
      onCancel={() => {
        setShowConfirmTutorial(false);
        setPlayer({ ...player, misc: { ...player.misc, skippedTutorial: true } });
      }}
      onConfirm={() => {
        setShowConfirmTutorial(false);
        setPlayer({ ...player, misc: { ...player.misc, skippedTutorial: false } });
      }}
      cancelText={'Skip Tutorial'}
      confirmText={'Play Tutorial'}
      color={'primary'}
      autoFocus={'confirm'}
    >
      If you've played before, you can skip the Chiba (Tutorial) Zone and move on to your own adventure.
    </ConfirmDialog>
  </FlexCol>
}