import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Card, Paragraph, Text, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchCollectibles } from '../services/CollectiblesServices';

const Collectibles = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const getData = async () => {
    try {
      const collectibles = await fetchCollectibles();
      setData(collectibles);
      setFilteredData(collectibles);
    } catch (error) {
      console.error('Error fetching collectibles:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getData();
    }, [])
  );

  const handleCardPress = (item) => {
    navigation.navigate('DataEntry', { item }); // Pass the selected item
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredItems = data.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filteredItems);
  };

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
        <ScrollView>
          {(searchQuery !== '' ? filteredData : data).map((item, index) => (
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
                      <Text style={styles.label}>Due Date</Text>
                      <Text style={styles.dueDate}>{item.due_date}</Text>
                    </View>

                    <View style={styles.detailsColumn}>
                      {/* Placeholder for potential future use */}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    padding: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f2045',
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f2045',
    lineHeight: 28,
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
});

export default Collectibles;
