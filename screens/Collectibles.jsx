import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Appbar, Card, Paragraph, Text, Searchbar, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchCollectibles, fetchAllCollectibles, fetchPeriodDateById, updateAll, fetchAllCollectiblesByPeriodDate } from '../services/CollectiblesServices';

const Collectibles = ({ route }) => {
  const navigation = useNavigation();
  const { periodId } = route.params;
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const [noDataMessage, setNoDataMessage] = useState(''); // Added noDataMessage state

  const getData = async () => {
    setLoading(true); // Start loading
    try {
      const periodDate = await fetchPeriodDateById(periodId);

      // Get the current date in GMT+8 timezone
      const offset = 8 * 60; // GMT+8 offset in minutes
      const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
        .toISOString()
        .split('T')[0];
      let collectibles;
      console.log('Period: ', periodId);
      console.log('CurrentDate:', currentDate);
      console.log('PeriodDate:', periodDate);

      if (currentDate === periodDate) {
        console.log('1 this line was runned');
        collectibles = await fetchCollectibles(periodDate);
      } else {
        console.log('2 this line was runned');
        collectibles = await fetchAllCollectiblesByPeriodDate(periodDate);
      }

      setData(collectibles);
      setFilteredData(collectibles);

      // Update noDataMessage based on the presence of collectibles
      if (collectibles.length === 0) {
        setNoDataMessage('No collectibles to be displayed. They might have already been printed or exported.');
      } else {
        setNoDataMessage('');
      }
    } catch (error) {
      console.error('Error fetching collectibles:', error);
      Alert.alert('Error', 'Failed to fetch collectibles');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useFocusEffect(
    useCallback(() => {
      getData();
    }, [periodId])
  );

  const handleCardPress = (item) => {
    navigation.navigate('DataEntry', { item });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredItems = data.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filteredItems);

    // Update noDataMessage based on search results
    if (filteredItems.length === 0 && query.length > 0) {
      setNoDataMessage('No matching collectibles found.');
    } else if (data.length === 0) {
      setNoDataMessage('No collectibles to be displayed. They might have already been printed or exported.\n',);
    } else {
      setNoDataMessage('');
    }
  };

  const handleUpdatePress = async (periodId) => {
    await updateAll(periodId);
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Collectibles" />
      </Appbar.Header>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0f2045" />
            <Text style={styles.loadingText}>Loading Collectibles...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TouchableOpacity key={index} onPress={() => handleCardPress(item)}>
                  <Card style={styles.card}>
                    <Card.Content>
                      <View style={styles.row}>
                        <Text style={styles.title}>Account Name</Text>
                        <Text style={styles.title}>Balance</Text>
                      </View>
                      <View style={styles.row}>
                        <Paragraph style={styles.accountNumber}>{item.name}</Paragraph>
                        <Paragraph style={styles.loanAmount}>₱{item.remaining_balance}</Paragraph>
                      </View>
                      <View style={styles.detailsRow}>
                        <View style={styles.detailsColumn}>
                          <Text style={styles.label}>Account Number</Text>
                          <Text style={styles.dueDate}>{item.account_number}</Text>
                        </View>

                        <View style={styles.detailsColumn}>
                          <Text style={styles.label}>Daily Due</Text>
                          <Text style={styles.dueDate}>{item.daily_due}</Text>
                        </View>

                        <View style={styles.detailsColumn}>
                          {/* Placeholder for potential future use */}
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noCollectiblesText}>
                {noDataMessage}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsColumn: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 8,
    color: '#0f2045',
  },
  loanAmount: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#0f2045',
    lineHeight: 28,
  },
  accountNumber: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#0f2045',
    lineHeight: 28,
    flexWrap: 'wrap',
    width: '70%',
  },
  label: {
    fontSize: 8,
    color: '#0f2045',
  },
  dueDate: {
    fontSize: 10,
    color: '#0f2045',
  },
  searchBar: {
    marginBottom: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    padding: 16,
  },
  updateButton: {
    borderRadius: 10,
  },
  noCollectiblesText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#0f2045',
    marginTop: '10%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0f2045',
    fontSize: 18,
  },
});

export default Collectibles;
